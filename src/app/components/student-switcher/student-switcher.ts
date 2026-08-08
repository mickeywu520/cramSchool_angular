import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudentContextService } from '../../services/student-context.service';

@Component({
  selector: 'app-student-switcher',
  imports: [FormsModule],
  template: `
    @if (ctx.showSwitcher) {
      <div class="flex items-center justify-end px-1">
        <select
          [ngModel]="ctx.selectedId()"
          (ngModelChange)="onChange($event)"
          class="rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-2 py-1.5 outline-none border border-white/20 cursor-pointer">
          @for (s of ctx.students(); track s.id) {
            <option [ngValue]="s.id" class="text-[#101819]">{{ s.student_name }}{{ s.grade ? '（' + s.grade + '）' : '' }}</option>
          }
        </select>
      </div>
    }
  `,
})
export class StudentSwitcher implements OnInit {
  constructor(public ctx: StudentContextService) {}

  ngOnInit() {
    this.ctx.loadStudents();
  }

  onChange(id: number) {
    this.ctx.select(id);
  }
}
