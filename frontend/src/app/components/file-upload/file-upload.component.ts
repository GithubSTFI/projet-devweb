import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../api.service';

@Component({
    selector: 'app-file-upload',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './file-upload.component.html',
    styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit {
    private api = inject(ApiService);
    selectedFile: File | null = null;
    message = '';
    isSuccess = false;
    isDragOver = false;
    serverFiles: string[] = [];

    ngOnInit() {
        this.refreshFileList();
    }

    refreshFileList() {
        this.api.getFiles().subscribe({
            next: (res: any) => {
                if (res.files) {
                    this.serverFiles = res.files.reverse();
                }
            },
            error: (err) => console.error('Error fetching files:', err)
        });
    }

    // Drag & Drop Handlers
    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver = true;
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver = false;
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver = false;

        if (event.dataTransfer?.files.length) {
            this.selectedFile = event.dataTransfer.files[0];
            this.message = '';
        }
    }

    onFileSelected(event: any) {
        if (event.target.files.length) {
            this.selectedFile = event.target.files[0];
            this.message = '';
        }
    }

    upload() {
        if (!this.selectedFile) return;

        this.api.uploadFile(this.selectedFile).subscribe({
            next: (res: any) => {
                this.message = 'Fichier sauvegardé avec succès !';
                this.isSuccess = true;
                this.selectedFile = null;
                this.refreshFileList();

                setTimeout(() => { if (this.isSuccess) this.message = ''; }, 3000);
            },
            error: (err: any) => {
                this.message = 'Erreur lors de l\'envoi.';
                this.isSuccess = false;
                console.error(err);
            }
        });
    }

    downloadUrl(filename: string) {
        return 'http://localhost:3000/api/download/' + filename;
    }
}
