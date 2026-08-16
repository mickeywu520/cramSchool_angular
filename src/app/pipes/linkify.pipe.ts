import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'linkify',
})
export class LinkifyPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeHtml {
    if (!value) return '';
    const escaped = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    const html = escaped.replace(
      /(https?:\/\/[^\s<>"'）)\]】]+)/g,
      (url) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:opacity-80 break-all">${url}</a>`
    );
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}