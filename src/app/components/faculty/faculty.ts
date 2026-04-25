import { Component, signal, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-faculty',
  imports: [RouterLink],
  templateUrl: './faculty.html',
  styleUrl: './faculty.scss',
})
export class Faculty implements OnInit, AfterViewInit {
  @ViewChild('teacherList') teacherList!: ElementRef;
  
  selectedFilter = signal<string>('all');
  searchQuery = signal<string>('');
  selectedTeacher = signal<any>(null);
  highlightTeacher = signal<string>('');

  ngOnInit() {
    window.scrollTo(0, 0);
    
    const params = new URLSearchParams(window.location.search);
    const teacherName = params.get('teacher');
    if (teacherName) {
      this.highlightTeacher.set(decodeURIComponent(teacherName));
    }
  }

  ngAfterViewInit() {
    if (this.highlightTeacher()) {
      setTimeout(() => {
        const element = document.querySelector(`[data-teacher="${this.highlightTeacher()}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }

  filters = [
    { id: 'all', label: '全部師資' },
    { id: 'math', label: '數學科' },
    { id: 'english', label: '英文科' },
    { id: 'science', label: '理化科' },
    { id: 'chinese', label: '國文科' }
  ];

teachers = [
    {
      name: '秦清',
      subject: '國文科',
      degree: '國中國文專家',
      experience: '豐富',
      image: '/teachers/秦清_photo.jpg',
      lifePhoto: '/teachers/秦清_life.jpg',
      philosophy: '國文不該是無邊際的死背，而是有脈絡的邏輯。秦清老師深耕國中會考場域，深知孩子面對一到六冊龐雜知識的焦慮。憑藉對國學常識的深厚底蘊，秦清老師擅長將枯燥的文化理念，用最生動有趣的方式，帶領學生跨越背誦的門檻，讓學習國文成為一種策略性的享受。',
      highlight: '把複雜的事情簡單化，把簡單的事情生動化',
      subjectId: 'chinese'
    },
    {
      name: '程昊',
      subject: '數學科',
      degree: '禾笙教育創辦人',
      experience: '25年',
      image: '/teachers/程昊_photo.jpg',
      lifePhoto: '/teachers/程昊_life.jpg',
      philosophy: '陪伴孩子成長的數學領航員。25年的教學積澱創立禾笙教育，希望為孩子打造一個積極且溫暖的數學殿堂。在教學字典裡，數學不只是公式，更是啟發自我、建立自信的工具。透過創新的互動教學，激發學生的學習動力，陪伴他們在探索知識的過程中，學會正向面對挑戰。',
      highlight: '數學不只是公式，更是啟發自我、建立自信的工具',
      subjectId: 'math'
    },
    {
      name: 'Howard',
      subject: '英文科',
      degree: '國中英文專家',
      experience: '豐富',
      image: '/teachers/Howard_photo.jpg',
      lifePhoto: '/teachers/Howard_life.jpg',
      philosophy: '個性親切溫和有耐心，透過清楚的講解與練習，陪著學生一起面實問題一起成長，提升英文實力之餘，更讓學生對於學習有自信與成就感。',
      highlight: '提升英文實力之餘，更讓學生對於學習有自信',
      subjectId: 'english'
    },
    {
      name: '張丞',
      subject: '數學科',
      degree: '國中數學專家',
      experience: '豐富',
      image: '/teachers/張丞_photo.jpg',
      lifePhoto: '/teachers/張丞_life.jpg',
      philosophy: '曾經也是看著題目無從下筆，努力回想一切所學卻依然呆望著考卷徘徊在放棄的念頭中。因為至始至终是考卷在支配學生，把主導權搶過來！換你來支配考卷的題目，給你滿滿的信心、勇氣及智慧馳騁考場，以最淺顯易懂的教學，帶你進入數學的世界。',
      highlight: '換你來支配考卷的題目',
      subjectId: 'math'
    },
    {
      name: 'Eva',
      subject: '英文科',
      degree: '國中英文專家',
      experience: '豐富',
      image: '/teachers/Eva_photo.jpg',
      lifePhoto: '/teachers/Eva_life.jpg',
      philosophy: '喜歡奶茶，喜歡小狗，更喜歡把英文變得簡單好理解。多年培養出的英文語感搭配文法將讓你在考場上無懈可擊。英文不該是無字天書，學生常常被過長的句子和文章嚇到無從下筆，在學習的過程中帶你拆解句型文法，提供素養題型的訓練和翻譯作文的練習。',
      highlight: '把英文變得簡單好理解',
      subjectId: 'english'
    },
    {
      name: '張羽',
      subject: '國文科',
      degree: '國中國文專家',
      experience: '豐富',
      image: '/teachers/張羽_photo.jpg',
      lifePhoto: '/teachers/張羽_life.jpg',
      philosophy: '教育是傳承，也是知識與人生的分享。用有趣且嚴謹的氣氛帶領學生進入國文的世界，並致力於將知識與生活結合，讓孩子在充滿思考又不失幽默的學習氣氛中獲得成就與成長。',
      highlight: '教育是傳承，也是知識與人生的分享',
      subjectId: 'chinese'
    },
    {
      name: '段諭',
      subject: '理化科',
      degree: '理化專家',
      experience: '豐富',
      image: '/teachers/段諭_photo.jpg',
      lifePhoto: '/teachers/段諭_life.jpg',
      philosophy: '教育是傳承，也是知識與人生的分享。用有趣且嚴謹的氣氛帶領學生進入數理的世界，並致力於將知識與生活結合，讓孩子在充滿思考又不失幽默的學習氣氛中獲得成就與成長。每個孩子都是獨一無二的個體，潛藏無限可能性。',
      highlight: '用行動換取學生的感動，用付出迎來學生的努力',
      subjectId: 'science'
    },
    {
      name: '彤妤',
      subject: '地科',
      degree: '地球科學專家',
      experience: '豐富',
      image: '/teachers/彤妤_photo.jpg',
      lifePhoto: '/teachers/彤妤_life.jpg',
      philosophy: '教育是一種知識與價值觀的傳遞。身為科學教師，需要傳授給學生的不只是正確的科學知識，還有科學的思維模式。在幫助學生順利升學之餘，還能夠讓學生在將來的人生當中，以正確的邏輯去看待事物。',
      highlight: '以正確的邏輯去看待事物，以科學的方式去思考',
      subjectId: 'science'
    },
    {
      name: '翟雨時',
      subject: '地科',
      degree: '地球科學專家',
      experience: '豐富',
      image: '/teachers/翟雨時_photo.jpg',
      lifePhoto: '/teachers/翟雨時_life.jpg',
      philosophy: '地科是一門應用科學，會運用到一些基礎的物理與化學概念，並且有許多與生活現象、經驗有連結性的知識。本課程亦會結合跨科知識、生活經驗、以及電影動漫橋段等，幫助學生應對跨科的素養考題。',
      highlight: '生活處處是科學，科學就在生活之中',
      subjectId: 'science'
    },
    {
      name: '伯壎',
      subject: '數學科',
      degree: '高中數學專家',
      experience: '豐富',
      image: '/teachers/伯壎_photo.jpg',
      lifePhoto: '/teachers/伯壎_life.jpg',
      philosophy: '數學，不該是誰的心理陰影。學生對數學的恐懼，往往來自於「聽不懂卻被要求背下來」的無力感。我不相信有教不會的學生，只相信還沒被理順的邏輯。拒絕死背，耐心陪伴，讓學生每一步都踩得比別人穩。',
      highlight: '比起考高分，更想讓你發現：原來我也能懂數學',
      subjectId: 'math'
    },
    {
      name: '李詠',
      subject: '化學科',
      degree: '高中化學專家',
      experience: '豐富',
      image: '/teachers/李詠_photo.jpg',
      lifePhoto: '/teachers/李詠_life.jpg',
      philosophy: '原理，是「原來該理解」！化學不是一門背科，所有的觀念都有他的原理在。老師會帶著你一步一步的了解化學科中所有的細節，實驗的裝置、物質的奧妙、化學反應的過程等。「李解生活、詠抱化學」，生活處處是化學，從生活中的例子理解課本中的觀念。',
      highlight: '生活處處是化學，從生活中的例子理解課本中的觀念',
      subjectId: 'science'
    },
    {
      name: '李暘',
      subject: '物理科',
      degree: '師大物理系',
      experience: '豐富',
      image: '/teachers/李暘_photo.jpg',
      lifePhoto: '/teachers/李暘_life.jpg',
      philosophy: '師大物理系畢，並且擁有多年高中物理教學資歷。「不要用學生不懂的話去教他不會的知識，否則就是雙重的不懂。」教學善於舉例，甚至是用故事或是人生哲學來幫助學生理解較抽象的概念。「有時背一個公式，不如記一個現象。」',
      highlight: '有時背一個公式，不如記一個現象',
      subjectId: 'science'
    },
    {
      name: '王御',
      subject: '物理科',
      degree: '高中物理專家',
      experience: '豐富',
      image: '/teachers/王御_photo.jpg',
      lifePhoto: '/teachers/王御_life.jpg',
      philosophy: '觀念重於解題、熟知歷屆考題、傾聽學生的聲音。比悲傷更悲傷的事，是沒辦法讓學生喜歡上物理。物理並不是大部分學生所想像的那樣冷冰冰。生活即物理，物理即生活。有效率的學習物理並建立清晰的物理圖像，是教學方針。',
      highlight: '生活即物理，物理即生活',
      subjectId: 'science'
    }
  ];

  setFilter(filterId: string) {
    this.selectedFilter.set(filterId);
  }

  openModal(teacher: any) {
    this.selectedTeacher.set(teacher);
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.selectedTeacher.set(null);
    document.body.style.overflow = '';
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