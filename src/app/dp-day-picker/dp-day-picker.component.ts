import {
  Component,
  Input,
  HostListener,
  forwardRef,
  SimpleChanges,
  OnChanges,
  OnInit
} from '@angular/core';
import {DpCalendarComponent} from '../dp-calendar/dp-calendar.component';
import * as moment from 'moment';
import {Moment} from 'moment';
import {DayPickerService} from './service/day-picker.service';
import {IDayPickerConfig} from './service/day-picker-config.model';
import {ICalendarConfig} from '../dp-calendar/config/calendar-config.model';
import {ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, NG_VALIDATORS, Validator} from '@angular/forms';
import {UtilsService} from '../common/services/utils/utils.service';
import {IObDayPickerApi} from './dp-day-picker.api';
import {DpTimePickerComponent} from '../dp-time-picker/dp-time-picker.component';

@Component({
  selector: 'dp-day-picker',
  templateUrl: './dp-day-picker.component.html',
  styleUrls: ['./dp-day-picker.component.less'],
  entryComponents: [DpCalendarComponent, DpTimePickerComponent],
  providers: [
    DayPickerService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DpDayPickerComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DpDayPickerComponent),
      multi: true
    }
  ]
})
export class DpDayPickerComponent implements OnChanges, OnInit, ControlValueAccessor, Validator {
  private shouldNgInit: boolean = true;
  @Input('config') private userConfig: IDayPickerConfig;

  // attributes
  @Input() private placeholder: string = '';
  @Input() private disabled: boolean = false;

  // validations
  @Input() private minDate: Moment | string;
  @Input() private maxDate: Moment | string;

  private areCalendarsShown: boolean = false;
  private hideStateHelper: boolean = false;
  private pickerConfig: IDayPickerConfig;
  private calendars: ICalendarConfig[];
  private _value: Moment;
  private userValue;
  private viewValue: string;
  private userValueType: string = 'object';
  validateFn: Function;

  private get value(): Moment {
    return this._value;
  }

  private set value(value: Moment) {
    this._value = value;
    this.viewValue = value ? value.format(this.pickerConfig.format) : '';
    const val = this.userValueType === 'string' ? this.viewValue : value;
    if (this.value) {
      this.calendars = this.dayPickerService.moveCalendars(this.pickerConfig, this.value, this.value, 0);
    }
    this.onChangeCallback(val);
  }

  api: IObDayPickerApi = <IObDayPickerApi>{};

  constructor(private dayPickerService: DayPickerService) {
  }

  @HostListener('click')
  onClick() {
    this.hideStateHelper = true;
  }

  @HostListener('document:click')
  onBodyClick() {
    if (!this.hideStateHelper) {
      this.hideCalendars();
    }
    this.hideStateHelper = false;
  }

  ngOnInit() {
    if (this.shouldNgInit) {
      this.init();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.shouldNgInit = false;
    const {minDate, maxDate} = changes;
    this.init();

    if (minDate || maxDate) {
      this.initValidators();
    }
  }

  writeValue(value: Moment): void {
    if (value) {
      this.userValueType = typeof value;
      this.userValue = value;
      this.init();
    }
  }

  onChangeCallback(_: any) {
  };

  registerOnChange(fn: any): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: any): void {
  }

  validate(c: FormControl) {
    if (this.minDate || this.maxDate) {
      return this.validateFn(c);
    } else {
      return () => null;
    }
  }

  isDateValid(value: string) {
    if (this.dayPickerService.isDateValid(value, this.pickerConfig.format)) {
      this.value = moment(value, this.pickerConfig.format);
    } else {
      this.value = null;
    }
  }

  // start
  init() {
    this.pickerConfig = this.dayPickerService.getConfig(this.userConfig);
    this.value = this.userValue ? UtilsService.convertToMoment(this.userValue, this.pickerConfig.format) : this.value;
    this.calendars = this.dayPickerService.generateCalendars(this.pickerConfig, this.value);
    this.initApi();
  }

  initValidators() {
    this.validateFn = this.dayPickerService.createValidator({
      minDate: typeof this.minDate === 'string' ?
        moment(<string>this.minDate, this.pickerConfig.format) : <Moment>this.minDate,
      maxDate: typeof this.maxDate === 'string' ?
        moment(<string>this.maxDate, this.pickerConfig.format) : <Moment>this.maxDate
    }, this.pickerConfig.format);
    this.onChangeCallback(this.viewValue);
  }

  initApi() {
    this.api = {
      open: this.showCalendars.bind(this),
      close: this.hideCalendars.bind(this)
    };
  }

  daySelected({day}) {
    this.value = day.date;

    if (this.pickerConfig.closeOnSelect) {
      setTimeout(this.hideCalendars, this.pickerConfig.closeOnSelectDelay);
    }
  }

  inputFocused() {
    this.hideStateHelper = false;
    this.areCalendarsShown = true;
  }

  showCalendars = () => {
    this.hideStateHelper = true;
    this.areCalendarsShown = true;
  };

  hideCalendars = () => {
    this.areCalendarsShown = false;
  };

  moveCalendars(base: Moment, months: number) {
    this.calendars = this.dayPickerService.moveCalendars(this.pickerConfig, this.value, base, months);
  }

  isLeftNavDisabled(month: Moment): boolean {
    return this.dayPickerService.isMinMonth(<Moment>this.pickerConfig.min, month);
  }

  isRightNavDisabled(month: Moment): boolean {
    return this.dayPickerService.isMaxMonth(<Moment>this.pickerConfig.max, month);
  }

  onViewDateChange(date: string) {
    if (this.dayPickerService.isDateValid(date, this.pickerConfig.format)) {
      this.value = date !== '' ? moment(date, this.pickerConfig.format) : null;

    } else {
      this.onChangeCallback(undefined);
    }
  }

  onKeydown(e: KeyboardEvent) {
    if (e.keyCode === 13) {
      this.areCalendarsShown = !this.areCalendarsShown;
      e.preventDefault();
    }

    if (e.keyCode === 27) {
      this.areCalendarsShown = false;
      e.preventDefault();
    }

    if (this.pickerConfig.disableKeypress) {
      e.preventDefault();
    }
  }
}
