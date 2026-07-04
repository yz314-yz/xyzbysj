import { forwardRef } from 'react';

const cnNumerals = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十'];

export const BookPage = forwardRef(function BookPage({ pageNum, title, children, className = '', showTitle = true, showNum = true }, ref) {
  return (
    <div className={`book-page ${className}`} data-page-num={pageNum} ref={ref}>
      <div className="book-page-frame">
        {showTitle && (
          <aside className="book-page-margin">
            <span className="book-page-vert-title">{title}</span>
          </aside>
        )}
        <div className="book-page-body">
          {children}
        </div>
        {showNum && (
          <div className="book-page-num">— {cnNumerals[pageNum] ?? pageNum} —</div>
        )}
      </div>
    </div>
  );
});
