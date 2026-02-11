import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        RouterOutlet
    ],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
    auth = inject(AuthService);
    today = new Date();
    sidebarOpen = signal(false);

    toggleSidebar() {
        this.sidebarOpen.update(v => !v);
    }
}
