import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectService, Project } from '../../project.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../toast/toast.component';

@Component({
    selector: 'app-projects-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './projects-list.html',
    styleUrls: ['./projects-list.scss'],
    animations: [
        trigger('listAnimation', [
            transition('* <=> *', [
                query(':enter', [
                    style({ opacity: 0, transform: 'translateY(20px)' }),
                    stagger('100ms', animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' })))
                ], { optional: true })
            ])
        ])
    ]
})
export class ProjectsListComponent implements OnInit {
    private projectService = inject(ProjectService);
    private toast = inject(ToastService);

    projects = signal<Project[]>([]);
    isLoading = signal(true);
    showModal = signal(false);

    newProject = {
        name: '',
        description: '',
        color: '#6366f1'
    };

    colors = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#0ea5e9'];

    ngOnInit() {
        this.loadProjects();
    }

    loadProjects() {
        this.isLoading.set(true);
        this.projectService.getMyProjects().subscribe({
            next: (res) => {
                this.projects.set(res.data);
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    createProject() {
        if (!this.newProject.name) return;

        this.projectService.createProject(this.newProject).subscribe({
            next: () => {
                this.toast.show('Projet créé avec succès', 'success');
                this.showModal.set(false);
                this.loadProjects();
                this.newProject = { name: '', description: '', color: '#6366f1' };
            },
            error: (err) => this.toast.show(err.error?.error || 'Erreur lors de la création', 'error')
        });
    }

    getInitials(name: string): string {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    getTaskStats(project: Project): string {
        if (!project.tasks || project.tasks.length === 0) return '0/0';
        const done = project.tasks.filter(t => t.status === 'DONE').length;
        return `${done}/${project.tasks.length}`;
    }
}
