﻿import {Moment} from 'jalali-moment';
import {IDate} from '../common/models/date.model';

export interface IDay extends IDate {
  date: Moment;
  selected?: boolean;
  currentMonth?: boolean;
  prevMonth?: boolean;
  nextMonth?: boolean;
  currentDay?: boolean;
}

export interface IDayEvent {
  day: IDay;
  event: MouseEvent;
}
