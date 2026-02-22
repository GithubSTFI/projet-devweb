import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Task } from './api.service';

export interface Project {
    id: number;
    name: string;
    description?: string;
    ownerId: number;
    color: string;
    createdAt: string;
    updatedAt: string;
    members?: any[];
    invitations?: any[];
    tasks?: Task[];
    owner?: { id: number; username: string };
}

@Injectable({
    providedIn: 'root'
})
export class ProjectService {
    private http = inject(HttpClient);
    private auth = inject(AuthService);
    private apiUrl = 'http://localhost:3000/api/projects';

    private getHeaders(): HttpHeaders {
        const token = this.auth.getToken();
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    getMyProjects(): Observable<any> {
        return this.http.get<{ data: Project[] }>(this.apiUrl, { headers: this.getHeaders() });
    }

    createProject(projectData: Partial<Project>): Observable<any> {
        return this.http.post(this.apiUrl, projectData, { headers: this.getHeaders() });
    }

    getProjectDetails(id: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }

    inviteMember(projectId: number, email: string, role: string = 'MEMBER'): Observable<any> {
        return this.http.post(`${this.apiUrl}/${projectId}/invite`, { email, role }, { headers: this.getHeaders() });
    }

    acceptInvitation(token: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/accept-invitation`, { token }, { headers: this.getHeaders() });
    }

    deleteProject(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }
}
