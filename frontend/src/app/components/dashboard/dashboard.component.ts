import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { ApiService } from '../../api.service';
import { NotificationService } from '../../notification.service';
import { trigger, transition, style, animate, state } from '@angular/animations';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        RouterOutlet
    ],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    animations: [
        trigger('dropdownAnimation', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(-10px) scale(0.95)' }),
                animate('200ms cubic-bezier(0, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
            ]),
            transition(':leave', [
                animate('150ms cubic-bezier(0.4, 0, 1, 1)', style({ opacity: 0, transform: 'translateY(-10px) scale(0.95)' }))
            ])
        ])
    ]
})
export class DashboardComponent implements OnInit {
    authService = inject(AuthService);
    apiService = inject(ApiService);
    notificationService = inject(NotificationService);
    router = inject(Router);

    user = this.authService.currentUser;
    isSidebarCollapsed = signal(false);
    isMobileMenuOpen = signal(false);
    isMobile = signal(false);

    // Use notification service signals
    notifications = this.notificationService.notifications;
    showNotifications = signal(false);
    unreadCount = this.notificationService.unreadCount;

    constructor() {
        this.checkScreenSize();
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', () => this.checkScreenSize());
        }
    }

    ngOnInit() {
        this.notificationService.loadNotifications().subscribe();
    }

    markAsRead(id: number) {
        this.notificationService.markAsRead(id).subscribe();
    }

    toggleNotifications() {
        this.showNotifications.update(v => !v);
    }

    getAvatarUrl(url: string | undefined): string {
        if (!url) return '';
        return url.startsWith('http') ? url : `http://localhost:3000${url}`;
    }

    checkScreenSize() {
        if (typeof window !== 'undefined') {
            this.isMobile.set(window.innerWidth < 768);
        }
    }

    toggleSidebar() {
        if (this.isMobile()) {
            this.isMobileMenuOpen.update(v => !v);
        } else {
            this.isSidebarCollapsed.update(v => !v);
        }
    }

    closeMobileMenu() {
        this.isMobileMenuOpen.set(false);
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/auth']);
    }
}
