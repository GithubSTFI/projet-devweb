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
    completed?: boolean; // Legacy support
    userId: number;
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

    getTasks(status: string = 'all'): Observable<any> {
        let params = new HttpParams();
        if (status && status !== 'all') {
            params = params.set('status', status);
        }
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

    // --- DEMOS (Async & Security) ---

    startAsyncTask(): Observable<any> {
        return this.http.post(`${this.apiUrl}/async-task`, {});
    }

    searchSecure(query: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/secure/search?q=${query}`);
    }

    searchInsecure(query: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/insecure/search?q=${query}`);
    }
}
