import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../api.service';
import { AuthService } from '../../auth.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-file-list',
    standalone: true,
    imports: [CommonModule, ConfirmDialogComponent],
    templateUrl: './file-list.component.html',
    styleUrls: ['./file-list.component.scss']
})
export class FileListComponent implements OnInit {
    private api = inject(ApiService);
    private auth = inject(AuthService);
    files = signal<any[]>([]);
    showConfirm = signal(false);
    fileToDeleteId = signal<number | null>(null);

    ngOnInit() {
        this.api.getFiles().subscribe({
            next: (res: any) => this.files.set(res.files),
            error: (err) => console.error(err)
        });
    }

    getDownloadUrl(filename: string) {
        const token = this.auth.getToken();
        return `http://localhost:3000/api/download/${encodeURIComponent(filename)}?token=${token}`;
    }

    previewFile(filename: string) {
        const token = this.auth.getToken();
        const url = `http://localhost:3000/api/files/preview/${encodeURIComponent(filename)}?token=${token}`;
        window.open(url, '_blank');
    }

    getFileIcon(filename: string): string {
        const ext = filename.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf': return 'picture_as_pdf';
            case 'jpg': case 'jpeg': case 'png': case 'gif': return 'image';
            case 'doc': case 'docx': return 'description';
            case 'xls': case 'xlsx': return 'table_view';
            case 'zip': case 'rar': return 'folder_zip';
            default: return 'insert_drive_file';
        }
    }

    getFileExtension(filename: string): string {
        return filename.split('.').pop()?.toUpperCase() || '-';
    }

    deleteFile(id: number) {
        this.fileToDeleteId.set(id);
        this.showConfirm.set(true);
    }

    confirmDelete() {
        const id = this.fileToDeleteId();
        if (!id) return;

        this.api.deleteFile(id).subscribe({
            next: () => {
                this.files.set(this.files().filter(f => f.id !== id));
                this.showConfirm.set(false);
            },
            error: (err) => {
                console.error(err);
                this.showConfirm.set(false);
            }
        });
    }

    cancelDelete() {
        this.showConfirm.set(false);
        this.fileToDeleteId.set(null);
    }
}
