import { Injectable } from '@angular/core';
import { PointModel } from '../models/point.model';
import { PointCircleModel } from '../models/point-circle.model';

@Injectable({
  providedIn: 'root'
})
export class PolygonHelper {

  constructor() { }

  findMidPoint(point1: number[], point2: number[]): PointModel {
    return { x: (point1[0] + point2[0]) / 2, y: (point1[1] + point2[1]) / 2 };
  }

  findLength(point1: number[], point2: number[]): number {
    const a = point1[0] - point2[0];
    const b = point1[1] - point2[1];
    return Math.round(Math.round(Math.sqrt(a * a + b * b) * 100) / 100);
  }

  findVector(point1: number[], point2: number[]): PointModel {
    return { x: point2[0] - point1[0], y: point2[1] - point1[1] };
  }

  checkIfCircleInLine(x: number, y: number, x1: number, y1: number, x2: number, y2: number): PointCircleModel {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;

    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSquared));

    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;

    const distance = Math.sqrt((x - closestX) * (x - closestX) + (y - closestY) * (y - closestY));

    return {
      x: x2,
      y: y2,
      result: distance
    };
  }

  findAngle(A: number[], B: number[], C: number[]): number {
    const AB = Math.sqrt(Math.pow(B[0] - A[0], 2) + Math.pow(B[1] - A[1], 2));
    const BC = Math.sqrt(Math.pow(B[0] - C[0], 2) + Math.pow(B[1] - C[1], 2));
    const AC = Math.sqrt(Math.pow(C[0] - A[0], 2) + Math.pow(C[1] - A[1], 2));
    const angle = Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
    return (angle * 180) / Math.PI;
  }
}
