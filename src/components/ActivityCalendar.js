import React, { useState } from 'react';
import './ActivityCalendar.css';

const ActivityCalendar = ({ data, targetStartDate, targetEndDate, daysToRender = 30 }) => {
    // data is an array of objects: { date: 'YYYY-MM-DD', count: N, points: P }

    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let startDate = new Date(today);
    let endDate = new Date(todayMidnight);

    if (targetStartDate && targetEndDate) {
        startDate = new Date(targetStartDate);
        endDate = new Date(targetEndDate);
        
        // Ensure endDate doesn't have time component that could interfere
        endDate.setHours(0, 0, 0, 0);
    } else {
        startDate.setDate(today.getDate() - daysToRender);
    }

    // Create a map of date string to activity count and count totals
    const activityMap = {};
    let rangeDataCount = 0;
    
    data.forEach(item => {
        if (targetStartDate && targetEndDate) {
            if (item.date >= targetStartDate && item.date <= targetEndDate) {
                activityMap[item.date] = item;
                rangeDataCount += item.count;
            }
        } else {
            // fallback if using daysToRender
            const itemDate = new Date(item.date);
            if (itemDate >= startDate && itemDate <= endDate) {
                activityMap[item.date] = item;
                rangeDataCount += item.count;
            }
        }
    });

    // adjust start date to previous sunday
    const startDayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDayOfWeek);
    startDate.setHours(0, 0, 0, 0);

    const endDayOfWeek = endDate.getDay();
    // adjust end date to next saturday
    endDate.setDate(endDate.getDate() + (6 - endDayOfWeek));

    const checkDate = new Date(startDate);
    const weeks = [];
    let currentWeek = [];

    while (checkDate <= endDate) {
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }

        const dateStr = checkDate.toISOString().split('T')[0];
        const activity = activityMap[dateStr] || { date: dateStr, count: 0, points: 0 };
        currentWeek.push({
            date: new Date(checkDate),
            dateStr: dateStr,
            count: activity.count,
            points: activity.points,
            future: checkDate > todayMidnight
        });

        checkDate.setDate(checkDate.getDate() + 1);
    }
    
    if (currentWeek.length > 0) {
        weeks.push(currentWeek);
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
                        <strong>{rangeDataCount}</strong> tasks completed {(targetStartDate && targetEndDate) ? 'in the selected period' : `in the last ${daysToRender} days`}
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
