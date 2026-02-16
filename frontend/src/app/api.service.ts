import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Task {
    id: number;
    title: string;
    description?: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate?: string;
    createdAt?: string;
    updatedAt?: string;
    userId: number;
    assignedUserId?: number | null;
    projectId?: number | null;
    owner?: { id: number; username: string };
    assignedUser?: { id: number; username: string };
}

export interface User {
    id: number;
    username: string;
    email: string;
    role: 'USER' | 'ADMIN';
    createdAt: string;
}

export interface AppNotification {
    id: number;
    message: string;
    isRead: boolean;
    type?: string;
    createdAt: string;
}

export interface ActivityLog {
    id: number;
    action: string;
    entityType: string;
    entityId?: number;
    createdAt: string;
    user?: { username: string };
}

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private http = inject(HttpClient);
    private auth = inject(AuthService);
    private apiUrl = 'http://localhost:3000/api';

    private getHeaders(): HttpHeaders {
        const token = this.auth.getToken();
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    // --- TASKS ---

    getTasks(status: string = 'all', priority: string = 'all', q: string = '', page: number = 1, limit: number = 10, projectId?: number, all?: boolean): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (status && status !== 'all') params = params.set('status', status);
        if (priority && priority !== 'all') params = params.set('priority', priority);
        if (q) params = params.set('q', q);
        if (projectId) params = params.set('projectId', projectId.toString());
        if (all) params = params.set('all', 'true');

        return this.http.get(`${this.apiUrl}/tasks`, { headers: this.getHeaders(), params });
    }

    createTask(taskData: Partial<Task>): Observable<any> {
        return this.http.post(`${this.apiUrl}/tasks`, taskData, { headers: this.getHeaders() });
    }

    updateTask(id: number, updates: Partial<Task>): Observable<any> {
        return this.http.put(`${this.apiUrl}/tasks/${id}`, updates, { headers: this.getHeaders() });
    }

    deleteTask(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/tasks/${id}`, { headers: this.getHeaders() });
    }

    // --- FILES ---

    uploadFile(file: File, taskId?: number): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        if (taskId) {
            formData.append('taskId', taskId.toString());
        }
        return this.http.post(`${this.apiUrl}/upload`, formData, { headers: this.getHeaders() });
    }

    getFiles(taskId?: number): Observable<any> {
        let params = new HttpParams();
        if (taskId) params = params.set('taskId', taskId.toString());
        return this.http.get(`${this.apiUrl}/files`, { headers: this.getHeaders(), params });
    }

    getStats(): Observable<any> {
        return this.http.get(`${this.apiUrl}/tasks/stats`, { headers: this.getHeaders() });
    }

    // --- NOTIFICATIONS ---
    getNotifications(): Observable<any> {
        return this.http.get(`${this.apiUrl}/notifications`, { headers: this.getHeaders() });
    }

    listUsers(): Observable<any> {
        return this.http.get(`${this.apiUrl}/users`, { headers: this.getHeaders() });
    }

    markAsRead(id: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/notifications/${id}/read`, {}, { headers: this.getHeaders() });
    }

    markAllAsRead(): Observable<any> {
        return this.http.put(`${this.apiUrl}/notifications/read-all`, {}, { headers: this.getHeaders() });
    }

    deleteNotification(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/notifications/${id}`, { headers: this.getHeaders() });
    }

    deleteMultipleNotifications(ids: number[]): Observable<any> {
        return this.http.post(`${this.apiUrl}/notifications/delete-multiple`, { ids }, { headers: this.getHeaders() });
    }

    // --- USERS ---
    updateAvatar(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('avatar', file);
        return this.http.post(`${this.apiUrl}/profile/avatar`, formData, { headers: this.getHeaders() });
    }

    // --- ADMIN ---
    getUsers(): Observable<any> {
        return this.http.get(`${this.apiUrl}/admin/users`, { headers: this.getHeaders() });
    }

    deleteUser(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/admin/users/${id}`, { headers: this.getHeaders() });
    }

    updateUser(id: number, userData: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/admin/users/${id}`, userData, { headers: this.getHeaders() });
    }

    getLogs(page: number = 1, limit: number = 20): Observable<any> {
        const params = new HttpParams().set('page', page).set('limit', limit);
        return this.http.get(`${this.apiUrl}/admin/logs`, { headers: this.getHeaders(), params });
    }

    // --- LEGACY / DEMO METHODS ---
    getProfile(): Observable<any> {
        return this.http.get(`${this.apiUrl}/profile`, { headers: this.getHeaders() });
    }

    startAsyncTask(): Observable<any> {
        return this.http.get(`${this.apiUrl}/async-task`, { headers: this.getHeaders() });
    }

    searchInsecure(query: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/search-insecure?q=${query}`, { headers: this.getHeaders() });
    }

    searchSecure(query: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/search-secure?q=${query}`, { headers: this.getHeaders() });
    }
}
