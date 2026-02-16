import { Pipe, PipeTransform } from '@angular/core';
import { Task } from './api.service';

@Pipe({
    name: 'filterStatus',
    standalone: true
})
export class FilterStatusPipe implements PipeTransform {
    transform(tasks: Task[], status: string): Task[] {
        if (!tasks) return [];
        return tasks.filter(t => t.status === status);
    }
}
