import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectService, Project } from '../../project.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../toast/toast.component';
import { LoaderComponent } from '../loader/loader.component';
import { ChangeDetectionStrategy } from '@angular/core';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-projects-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, LoaderComponent, ConfirmDialogComponent],
    templateUrl: './projects-list.html',
    styleUrls: ['./projects-list.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
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
    activeProjectMenu = signal<number | null>(null);

    // Form logic
    isSavingProject = signal(false);
    isSubmitted = signal(false);

    // Confirmation logic
    showConfirm = signal(false);
    projectToDeleteId = signal<number | null>(null);

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
        this.isSubmitted.set(true);
        if (!this.newProject.name) return;

        this.isSavingProject.set(true);
        this.projectService.createProject(this.newProject).subscribe({
            next: () => {
                this.toast.show('Projet créé avec succès', 'success');
                this.showModal.set(false);
                this.isSavingProject.set(false);
                this.isSubmitted.set(false);
                this.loadProjects();
                this.newProject = { name: '', description: '', color: '#6366f1' };
            },
            error: (err) => {
                this.isSavingProject.set(false);
                this.toast.show(err.error?.error || 'Erreur lors de la création', 'error');
            }
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

    toggleMenu(projectId: number) {
        if (this.activeProjectMenu() === projectId) {
            this.activeProjectMenu.set(null);
        } else {
            this.activeProjectMenu.set(projectId);
        }
    }

    deleteProject(id: number) {
        this.projectToDeleteId.set(id);
        this.showConfirm.set(true);
    }

    confirmDelete() {
        const id = this.projectToDeleteId();
        if (!id) return;

        this.projectService.deleteProject(id).subscribe({
            next: () => {
                this.toast.show('Projet supprimé', 'success');
                this.showConfirm.set(false);
                this.loadProjects();
            },
            error: (err) => {
                this.showConfirm.set(false);
                this.toast.show(err.error?.error || 'Erreur', 'error');
            }
        });
    }

    cancelDelete() {
        this.showConfirm.set(false);
        this.projectToDeleteId.set(null);
    }
}
