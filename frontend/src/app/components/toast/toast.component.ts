import { Component, Injectable, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    toasts = signal<Toast[]>([]);
    private counter = 0;

    show(message: string, type: 'success' | 'error' | 'info' = 'info') {
        const id = this.counter++;
        this.toasts.update(current => [...current, { id, message, type }]);

        // Auto-remove after 3 seconds
        setTimeout(() => this.remove(id), 3000);
    }

    remove(id: number) {
        this.toasts.update(current => current.filter(t => t.id !== id));
    }
}

@Component({
    selector: 'app-toasts',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './toast.component.html',
    styleUrls: ['./toast.component.scss']
})
export class ToastComponent {
    constructor(public toastService: ToastService) { }
}
