import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-faculty',
  imports: [RouterLink],
  templateUrl: './faculty.html',
  styleUrl: './faculty.scss',
})
export class Faculty {
  selectedFilter = signal<string>('all');
  searchQuery = signal<string>('');

  filters = [
    { id: 'all', label: '全部師資' },
    { id: 'math', label: '數學科' },
    { id: 'english', label: '英文科' },
    { id: 'science', label: '理化科' },
    { id: 'chinese', label: '國文科' }
  ];

  teachers = [
    {
      name: '陳莎拉 博士',
      subject: '數學專家',
      degree: '國立臺灣大學 數學系博士',
      experience: '12年',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkvTBu91lHUB21y6TkkoEGc3Fivdqtlz6W4bE3uYBmzePkVcwTCOelCQNCHbLLqIV3GvDj09lgxbX1rRLxHpegn2N-8GYph9BGA3nQaSZKA84wci6Vgf-qn2gTJa1Jt-pkOyUzkPytJv07l04C332H1JyyYlSvhFHgzqTswomN5xsdv4DSCXVsBJjY80qJcoej_DAvv0ABElF7FDVlZcNxiTQ8ERtyeZQXZvB3VWlOtPWJ5ozcdEXJ2zV2EMifMrDVq-A0am89fyI',
      philosophy: '數學不只是計算，更是邏輯思維的體現。我致力於將複雜的公式拆解為直觀的理解，讓每個孩子都能在思考中獲得快樂。',
      subjectId: 'math'
    },
    {
      name: 'James Wilson',
      subject: '英文專家',
      degree: 'University of Oxford, Applied Linguistics',
      experience: '8年',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDS_g2oaNNwslbhYIINmstYGGZKlBED2qfmlg0fg42msvQ57eFGMj33W3xJoleO_LZ97gAvfDak73Viz-meMuDnIq3bgaNXYWOQAfJAsTQqzvsAa7hrkkAwdiKlqlKuVAKi3VA7wvwdCMKkvhB63OYhJnGQwd8-1ib0J3w1Pxya4JOEAjhk8x60P9v-gGUwG8TBjYSPIeeTO9Cgj69sURhVv0gPGY8E0-lZOMkrUdRQ43HdMKYtHP8KuzYxgngUOTtGbvGQrTwXuec',
      philosophy: '語言是連結世界的橋樑。我專注於沉浸式的教學模式，提升學生的口說自信與學術寫作能力，讓英語成為學生的本能。',
      subjectId: 'english'
    },
    {
      name: '林美玲 老師',
      subject: '理化專家',
      degree: '國立清華大學 化學研究所',
      experience: '15年',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC95x5rnbUt3K_KAT1kE_qXubabUycINmhioaF1HcsI22mBjfUBtxp4fUbWf4O9CcrQDbV2p4T-wt4qSmnsizeOI6vXnStLW_L5SreN2tvD4QlJT7R1vxoXdj8t3nn1C54bdMJVi8Jx_PY-QdwBTtlo5W-yOo-32JxmHozPZWDwauzoNDU-_BGzXCa6Lmtok9tDAHSZBHdVZs-4HcWX3zCYCauQDyeS_C_jkIUfeRvw94ZTiCSV5IcaeQRcn8rEZ0hmr6k7qRWd_Qc',
      philosophy: '科學就在生活之中。我喜歡透過實驗演示激發學生的好奇心，建立紮實的理化基礎，從根本解決解題的盲點。',
      subjectId: 'science'
    }
  ];

  setFilter(filterId: string) {
    this.selectedFilter.set(filterId);
  }

  get filteredTeachers() {
    let filtered = this.teachers;
    if (this.selectedFilter() !== 'all') {
      filtered = filtered.filter(t => t.subjectId === this.selectedFilter());
    }
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) || 
        t.subject.toLowerCase().includes(query)
      );
    }
    return filtered;
  }
}
