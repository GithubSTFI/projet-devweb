import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-loader',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="loader-container" [class.fullscreen]="fullscreen">
      <div class="spinner">
        <div class="double-bounce1"></div>
        <div class="double-bounce2"></div>
      </div>
      <p *ngIf="message" class="loader-message">{{ message }}</p>
    </div>
  `,
    styles: [`
    .loader-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      width: 100%;
      height: 100%;
      min-height: 150px;

      &.fullscreen {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.8);
        backdrop-filter: blur(8px);
        z-index: 99999;
      }
    }

    .spinner {
      width: 40px;
      height: 40px;
      position: relative;
    }

    .double-bounce1, .double-bounce2 {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-color: #6366f1;
      opacity: 0.6;
      position: absolute;
      top: 0;
      left: 0;
      animation: sk-bounce 2.0s infinite ease-in-out;
    }

    .double-bounce2 {
      animation-delay: -1.0s;
      background-color: #8b5cf6;
    }

    @keyframes sk-bounce {
      0%, 100% { transform: scale(0.0) }
      50% { transform: scale(1.0) }
    }

    .loader-message {
      margin-top: 15px;
      font-size: 0.85rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.5);
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
  `]
})
export class LoaderComponent {
    @Input() message: string = '';
    @Input() fullscreen: boolean = false;
}
