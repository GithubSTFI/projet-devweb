import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService, AppNotification } from '../../api.service';
import { NotificationService } from '../../notification.service';
import { ToastService } from '../toast/toast.component';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './notifications-page.html',
  styleUrls: ['./notifications-page.component.scss'],
  animations: [
    trigger('selectionAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class NotificationsPage implements OnInit {
  private notificationService = inject(NotificationService);
  private toast = inject(ToastService);

  notifications = this.notificationService.notifications;
  unreadCount = this.notificationService.unreadCount;
  isLoading = signal<boolean>(false);
  filter = signal<'all' | 'unread'>('all');

  // Multi-selection state
  selectedIds = signal<Set<number>>(new Set());
  isSelectionMode = computed(() => this.selectedIds().size > 0);

  filteredNotifications = computed(() => {
    const list = this.notifications();
    if (this.filter() === 'unread') {
      return list.filter((n: AppNotification) => !n.isRead);
    }
    return list;
  });

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.isLoading.set(true);
    this.notificationService.loadNotifications().subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false)
    });
  }

  markAsRead(id: number) {
    this.notificationService.markAsRead(id).subscribe();
  }

  deleteNotification(id: number) {
    this.notificationService.deleteNotification(id).subscribe();
  }

  markAllRead() {
    this.notificationService.markAllAsRead().subscribe();
  }

  setFilter(f: 'all' | 'unread') {
    this.filter.set(f);
    this.selectedIds.set(new Set()); // Reset selection when filtering
  }

  // Selection Methods
  toggleSelection(id: number) {
    this.selectedIds.update(set => {
      const newSet = new Set(set);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  toggleSelectAll() {
    const currentList = this.filteredNotifications();
    const allSelected = currentList.every(n => this.selectedIds().has(n.id));

    if (allSelected) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(currentList.map(n => n.id)));
    }
  }

  deleteSelected() {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    if (confirm(`Voulez-vous supprimer les ${ids.length} notifications sélectionnées ?`)) {
      this.notificationService.deleteMultiple(ids).subscribe({
        next: () => {
          this.selectedIds.set(new Set());
        }
      });
    }
  }

  markSelectedAsRead() {
    const ids = Array.from(this.selectedIds());
    this.clearSelection();
  }

  clearSelection() {
    this.selectedIds.set(new Set());
  }
}
