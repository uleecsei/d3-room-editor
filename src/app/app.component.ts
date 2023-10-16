import { AfterViewInit, Component, ElementRef, HostListener, ViewChild, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import * as uuid from 'uuid';
import { Shape } from './models/shape';
import { PolygonHelper } from './helpers/polygon.helper';

const initialRectangleCoordinates = [[300, 100], [675, 100], [675, 400], [300, 400]];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements AfterViewInit {
  dragging?: Shape;
  drawing!: Shape;
  svg: any;
  isRemoveModeOn = false;
  removeButtonDisabled = false;

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.resizeFigure();
  }

  @ViewChild('viewContainer') viewContainer!: ElementRef<HTMLElement>;

  constructor(private polygonHelper: PolygonHelper) {}

  ngAfterViewInit() {
    this.svg = d3.select('svg');
    this.createInitialRectangle();
    this.resizeFigure();
  }

  createInitialRectangle(): void {
    const shape = new Shape();
    shape.id = 'shape_' + uuid.v4();
    this.drawing = shape;
    this.svg.append('g').attr('id', shape.id);
    this.drawing.points.push(...initialRectangleCoordinates);
    this.updateShape(this.drawing);
  }

  toggleRemoveCornerMode(): void {
    this.isRemoveModeOn = !this.isRemoveModeOn;
    this.updateShape(this.drawing);
  }

  handleDrag(self: AppComponent) {
    return function(this: any) {
      let x = d3.event.x;
      let y = d3.event.y;

      const dragCircle = d3.select(this);
      const newPoints = [];
      let circle: any;

      const newPoint = [Math.round(x / 5) * 5, Math.round( y / 5) * 5];
      const poly = d3.select(this.parentNode).select('polygon');
      const circles = d3.select(this.parentNode).selectAll('circle') as any;
      dragCircle
        .attr('cx', newPoint[0])
        .attr('cy', newPoint[1]);
      for (let i = 0; i < circles._groups[0].length; i++) {
        circle = d3.select(circles._groups[0][i]);
        newPoints.push([Number(circle.attr('cx')), Number(circle.attr('cy'))]);
      }
      poly.attr('points', newPoints as any);
      self.dragging = self.drawing;
      self.dragging.points = newPoints;
      self.updateLineLabels(self.dragging);
      self.updateAngleLabels(self.dragging);
    }
  }

  endDrag(self: AppComponent) {
    return function (this: any) {
      const dragCircle = d3.select(this);
      let x = d3.event.x;
      let y = d3.event.y;

      const newPoints = [];
      let circle: any;
      const newPoint = [Math.round(x / 5) * 5, Math.round(y / 5) * 5];
      const poly = d3.select(this.parentNode).select('polygon');
      const circles = d3.select(this.parentNode).selectAll('circle') as any;
      dragCircle
        .attr('cx', newPoint[0])
        .attr('cy', newPoint[1]);
      for (let i = 0; i < circles._groups[0].length; i++) {
        circle = d3.select(circles._groups[0][i]);
        newPoints.push([Number(circle.attr('cx')), Number(circle.attr('cy'))]);
      }
      self.dragging = self.drawing;
      poly.attr('points', newPoints as any);
      self.updateLineLabels(self.dragging);
      self.updateAngleLabels(self.dragging);
      self.resizeFigure();
      self.dragging = undefined;
    }
  }

  handleStrokeClick(self: AppComponent) {
    return function (this: SVGPolygonElement) {
      if (self.isRemoveModeOn) {
        return;
      }
      self.addCircleInsideLine(self);
      self.updateShape(self.drawing);
      if (self.drawing.points.length > 3) {
        self.removeButtonDisabled = false;
      }
    }
  }

  removeCircle(self: AppComponent) {
    return function(this: SVGCircleElement) {
      self.drawing.points = self.drawing.points.filter((item: number[]) => !(item[0] === this.cx.baseVal.value && item[1] === this.cy.baseVal.value));
      self.updateShape(self.drawing);
      if (self.drawing.points.length <= 3) {
        self.removeButtonDisabled = true;
        self.isRemoveModeOn = false;
        self.updateShape(self.drawing);
      }
      self.resizeFigure();
    }
  }

  addCircleInsideLine(self: AppComponent): void {
    const resultArray = [];
    for (let i = 1; i < self.drawing.points.length; i++) {
      let point1 = self.drawing.points[i - 1];
      let point2 = self.drawing.points[i];

      resultArray.push(self.polygonHelper.checkIfCircleInLine(d3.event.offsetX, d3.event.offsetY, point1[0], point1[1], point2[0], point2[1]));
    }
    let point1 = self.drawing.points[self.drawing.points.length - 1];
    let point2 = self.drawing.points[0];
    resultArray.push(self.polygonHelper.checkIfCircleInLine(d3.event.offsetX, d3.event.offsetY, point1[0], point1[1], point2[0], point2[1]));
    const min = Math.min(...resultArray.map((item) => item.result as number));
    const result = resultArray.find((item) => item.result === min);
    const index = resultArray.findIndex((item) => item.result === result?.result);
    self.drawing.points.splice(index + 1, 0, [d3.event.offsetX, d3.event.offsetY]);
  }

  updateShape(shape: Shape): void {
    this.updatePolygon(shape);
    this.updateAngleLabels(shape);
    this.updateLineLabels(shape);
    this.updatePoints(shape);
  }

  updatePolygon(shape: Shape) {
    const g = this.svg.select('#' + shape.id);
    g.select('polygon').remove();
    g.insert('polygon', ':first-child')
      .attr('points', shape.points)
      .style('fill-opacity', '0')
      .style('cursor', this.isRemoveModeOn ? 'not-allowed' : 'pointer')
      .attr('stroke-width', 5)
      .attr('stroke', this.isRemoveModeOn ? '#f1f2f4' : '#000')
      .on('click', this.handleStrokeClick(this))
      .attr('pointer-events', 'stroke');
  }

  updateLineLabels(shape: Shape) {
    const g = this.svg.select('#' + shape.id);
    g.selectAll('text.line-label').remove();
    let point1;
    let point2;
    for (let i = 1; i < shape.points.length; i++) {
      point1 = shape.points[i - 1];
      point2 = shape.points[i];

      this.addLineLabel(g, point1, point2);
    }
    point1 = shape.points[0];
    point2 = shape.points[shape.points.length - 1];
    this.addLineLabel(g, point1, point2);
  }

  addLineLabel(g: any, point1: number[], point2: number[]) {
    const midPoint = this.polygonHelper.findMidPoint(point1, point2);
    const text = this.polygonHelper.findLength(point1, point2);
    const vector = this.polygonHelper.findVector(point1, point2);
    const offsetX = vector.y === 0 ? 0 : vector.y <= 0 && vector.x >= 0 ? -20 : 20;
    const offsetY = vector.x === 0 ? 0 : vector.y <= 0 && vector.x >= 0 || vector.y <= 0 && vector.x <= 0 || vector.y >= 0 && vector.x >= 0 ? -15 : 25;
    if (text > 0) {
      let lineClass = 'line-label';
      let label = g.insert('text', ':first-child')
        .attr('x', midPoint.x)
        .attr('y', midPoint.y)
        .attr('dx', offsetX)
        .attr('dy', offsetY)
        .attr('text-anchor', 'middle')
        .attr('class', lineClass)
        .style('user-select', 'none')
        .text(text);
    }
  }

  updatePoints(shape: Shape) {
    const g = this.svg.select('#' + shape.id);
    g.selectAll('circle').remove();
    let pointLength = shape.points.length;
    for (let i = 0; i < pointLength; i++) {
      const point = shape.points[i];
      const circle = g.append('circle')
        .attr('cx', point[0])
        .attr('cy', point[1])
        .attr('r', 8)
        .attr('fill', '#FF0066')
        .attr('stroke', '#FF0066');
      if (this.isRemoveModeOn) {
        circle
          .on('click', this.removeCircle(this))
          .style('cursor', 'pointer');
      }
      else {
        const dragger = d3.drag()
          .on('drag', this.handleDrag(this))
          .on('end', this.endDrag(this));
        circle.call(dragger)
          .style("cursor", "move");
      }
    }
  }

  updateAngleLabels(shape: Shape) {
    let A, B, C;
    const g = this.svg.select('#' + shape.id);
    g.selectAll('text.angle-label').remove();
    if (shape.points.length > 2) {
      for (let i = 0; i < shape.points.length - 2; i++) {
        A = shape.points[i];
        B = shape.points[i + 1];
        C = shape.points[i + 2];
        this.addAngleLabel(g, A, B, C);
      }
      A = shape.points[shape.points.length - 1];
      B = shape.points[0];
      C = shape.points[1];
      this.addAngleLabel(g, A, B, C);

      A = shape.points[shape.points.length - 2];
      B = shape.points[shape.points.length - 1]
      C = shape.points[0];
      this.addAngleLabel(g, A, B, C);
    }
  }

  addAngleLabel(g: any, A: number[], B: number[], C: number[]) {
    const angle = this.polygonHelper.findAngle(A, B, C);
    if (!isNaN(angle)) {
      const vector1 = this.polygonHelper.findVector(A, B);
      const vector2 = this.polygonHelper.findVector(A, C);
      const midVector = {
        x: vector1.x + vector2.x,
        y: vector1.y + vector2.y
      };
      const offsetX = midVector.y > 0 ? 10 : -40;
      const offsetY = midVector.x >= 0 && midVector.y >= 0 ? 15 : -15;

      let text = g.insert('text', ':first-child')
        .attr('x', B[0])
        .attr('y', B[1])
        .attr('dx', offsetX)
        .attr('dy', offsetY)
        .attr('class', 'angle-label')
        .style('user-select', 'none')
        .text(`${Math.round(Math.round(angle * 100) / 100)}\xB0`);
    }
  }

  confirmRoom(): void {
    const bounds = this.drawing.points;
    console.log(bounds);
  }

  resizeFigure(): void {
    const svgRect = this.svg.node().getBoundingClientRect();
    const g = this.svg.select('#' + this.drawing.id);
    const htmlRect = g.node().getBoundingClientRect();

    const svgWidth = svgRect.width;
    const svgHeight = svgRect.height;
    const htmlWidth = htmlRect.width;
    const htmlHeight = htmlRect.height;

    const scaleX = svgWidth / htmlWidth;
    const scaleY = svgHeight / htmlHeight;

    const scale = Math.min(scaleX, scaleY);

    this.svg.attr("transform", `scale(${scale})`);

    const rect1 = g.node().getBoundingClientRect();
    const x1 = rect1.left;
    const y1 = rect1.top;
    const width1 = rect1.width;
    const height1 = rect1.height;

    const rect2 = this.viewContainer.nativeElement.getBoundingClientRect();
    const x2 = rect2.left;
    const y2 = rect2.top;
    const width2 = rect2.width;
    const height2 = rect2.height;

    const leftOverflow = x1 < x2 ? x2 - x1 : 0;
    const topOverflow = y1 < y2 ? y2 - y1 : 0;
    const rightOverflow = x1 + width1 > x2 + width2 ? x1 + width1 - (x2 + width2) : 0;
    const bottomOverflow = y1 + height1 > y2 + height2 ? y1 + height1 - (y2 + height2) : 0;

    this.svg.attr("transform", `translate(${leftOverflow - rightOverflow}, ${topOverflow - bottomOverflow}) scale(${scale})`);
  }
}

