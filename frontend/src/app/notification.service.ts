import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService, AppNotification } from './api.service';
import { ToastService } from './components/toast/toast.component';
import { tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private api = inject(ApiService);
    private toast = inject(ToastService);

    private _notifications = signal<AppNotification[]>([]);
    notifications = this._notifications.asReadonly();

    unreadCount = computed(() => this._notifications().filter(n => !n.isRead).length);

    loadNotifications() {
        return this.api.getNotifications().pipe(
            tap((res: any) => {
                this._notifications.set(res.data || []);
            })
        );
    }

    markAsRead(id: number) {
        return this.api.markAsRead(id).pipe(
            tap(() => {
                this._notifications.update(n => n.map(notif =>
                    notif.id === id ? { ...notif, isRead: true } : notif
                ));
            })
        );
    }

    markAllAsRead() {
        return this.api.markAllAsRead().pipe(
            tap(() => {
                this._notifications.update(n => n.map(notif => ({ ...notif, isRead: true })));
                this.toast.show('Toutes les notifications marquées comme lues', 'success');
            })
        );
    }

    deleteNotification(id: number) {
        // Assuming backend will have delete soon
        return this.api.deleteNotification(id).pipe(
            tap(() => {
                this._notifications.update(n => n.filter(notif => notif.id !== id));
                this.toast.show('Notification supprimée', 'info');
            })
        );
    }

    deleteMultiple(ids: number[]) {
        return this.api.deleteMultipleNotifications(ids).pipe(
            tap(() => {
                this._notifications.update(n => n.filter(notif => !ids.includes(notif.id)));
                this.toast.show(`${ids.length} notifications supprimées`, 'info');
            })
        );
    }
}
