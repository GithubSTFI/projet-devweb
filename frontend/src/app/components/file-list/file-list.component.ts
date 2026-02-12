import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../api.service';

@Component({
    selector: 'app-file-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './file-list.component.html',
    styleUrls: ['./file-list.component.scss']
})
export class FileListComponent implements OnInit {
    private api = inject(ApiService);
    files = signal<any[]>([]);

    ngOnInit() {
        this.api.getFiles().subscribe({
            next: (res: any) => this.files.set(res.files),
            error: (err) => console.error(err)
        });
    }

    getDownloadUrl(filename: string) {
        return 'http://localhost:3000/api/download/' + filename;
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
}
