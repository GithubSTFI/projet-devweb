import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastComponent],
  template: `
    <div class="grain-overlay"></div>
    <div class="spotlight" [style.left.px]="mouseX" [style.top.px]="mouseY"></div>
    <div class="custom-cursor" [style.left.px]="mouseX" [style.top.px]="mouseY" [class.hovering]="isHovering"></div>
    <div class="cursor-dot" [style.left.px]="mouseX" [style.top.px]="mouseY"></div>
    <app-toasts></app-toasts>
    <router-outlet></router-outlet>
  `
})
export class App {
  mouseX = 0;
  mouseY = 0;
  isHovering = false;

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);

    const target = e.target as HTMLElement;
    this.isHovering = !!target.closest('a, button, [role="button"], .project-card, .file-card');
  }
}
