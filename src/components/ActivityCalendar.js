import React, { useState } from 'react';
import './ActivityCalendar.css';

const ActivityCalendar = ({ data, daysToRender = 273 }) => {
    // data is an array of objects: { date: 'YYYY-MM-DD', count: N, points: P }
    // We need to render the last N days (configured by daysToRender)

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysToRender);

    // Create a map of date string to activity count
    const activityMap = {};
    data.forEach(item => {
        activityMap[item.date] = item;
    });

    const weeks = [];
    let currentWeek = [];

    // adjust start date to previous sunday
    const startDayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    const checkDate = new Date(startDate);

    while (checkDate <= today || checkDate.getDay() !== 0) {
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }

        const dateStr = checkDate.toISOString().split('T')[0];
        const activity = activityMap[dateStr] || { date: dateStr, count: 0, points: 0 };
        currentWeek.push({
            date: checkDate,
            dateStr: dateStr,
            count: activity.count,
            points: activity.points
        });

        checkDate.setDate(checkDate.getDate() + 1);

        // Final week fill up
        if (checkDate > today && checkDate.getDay() === 0) {
            if (currentWeek.length > 0) {
                while (currentWeek.length < 7) {
                    const dStr = checkDate.toISOString().split('T')[0];
                    currentWeek.push({
                        date: new Date(checkDate),
                        dateStr: dStr,
                        count: 0,
                        points: 0,
                        future: true
                    });
                    checkDate.setDate(checkDate.getDate() + 1);
                }
                weeks.push(currentWeek);
            }
            break;
        }
    }

    const getColorClass = (points) => {
        if (points === 0) return 'color-empty';
        if (points >= 1 && points <= 3) return 'color-scale-1';
        if (points >= 4 && points <= 7) return 'color-scale-2';
        return 'color-scale-4'; // 8+ points
    };

    const [tooltipInfo, setTooltipInfo] = useState({ show: false, x: 0, y: 0, content: null });

    const handleMouseEnter = (e, day) => {
        if (day.future) return;
        const rect = e.target.getBoundingClientRect();
        setTooltipInfo({
            show: true,
            x: rect.x + (rect.width / 2),
            y: rect.y - 10,
            content: {
                date: day.dateStr,
                count: day.count,
                points: day.points
            }
        });
    };

    const handleMouseLeave = () => {
        setTooltipInfo({ show: false, x: 0, y: 0, content: null });
    };

    return (
        <div className="activity-calendar-container">
            <div className="calendar-content-wrapper">
                <div className="calendar-grid">
                    {weeks.map((week, wIndex) => (
                        <div key={wIndex} className="calendar-week">
                            {week.map((day, dIndex) => (
                                <div
                                    key={dIndex}
                                    className={`calendar-day ${getColorClass(day.points)} ${day.future ? 'day-future' : ''}`}
                                    onMouseEnter={(e) => handleMouseEnter(e, day)}
                                    onMouseLeave={handleMouseLeave}
                                ></div>
                            ))}
                        </div>
                    ))}
                </div>

                <div className="calendar-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                    <div className="calendar-stats" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <strong>{data.reduce((sum, item) => sum + item.count, 0)}</strong> tasks completed in the last {daysToRender} days
                    </div>
                    <div className="calendar-legend">
                        <span>Less</span>
                        <div className="calendar-day color-empty"></div>
                        <div className="calendar-day color-scale-1"></div>
                        <div className="calendar-day color-scale-2"></div>
                        <div className="calendar-day color-scale-3"></div>
                        <div className="calendar-day color-scale-4"></div>
                        <span>More</span>
                    </div>
                </div>
            </div>

            {tooltipInfo.show && tooltipInfo.content && (
                <div
                    className="calendar-tooltip"
                    style={{ left: tooltipInfo.x, top: tooltipInfo.y }}
                >
                    <div className="tooltip-date">{new Date(tooltipInfo.content.date).toDateString()}</div>
                    <div className="tooltip-stats">
                        <strong>{tooltipInfo.content.count}</strong> tasks completed<br />
                        <strong>{tooltipInfo.content.points}</strong> story points earned
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityCalendar;
