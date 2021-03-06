import {
  observable, action, runInAction, computed, ObservableMap, toJS,
} from 'mobx';
import { IChosenFieldField, IUseChoseFieldProps } from './types';

type IChosenSpecialFieldField = IChosenFieldField & Required<Pick<IChosenFieldField, 'immutableCheck'>>
class ChoseFieldStore {
  constructor({ systemFields, customFields, chosenFields }: IUseChoseFieldProps) {
    this.fields = observable.map();
    this.fields.set('system', systemFields);
    this.fields.set('custom', customFields);
    chosenFields?.forEach((field) => {
      if (typeof (field.immutableCheck) === 'undefined') {
        if (typeof (field.value) !== 'undefined') {
          this.chosenFields.set(field.code, field);
        }
      } else {
        // 设置特殊值 不可更改
        this.addSpecialFields(field.code, field as IChosenSpecialFieldField);
      }
    });
  }

  @observable currentOptionStatus: 'ALL' | 'PART' | 'NONE' = 'NONE';

  @observable fields: ObservableMap<'system' | 'custom', Array<IChosenFieldField>>;;

  @observable chosenFields: ObservableMap<string, IChosenFieldField> = observable.map();

  @observable specialFields: ObservableMap<string, IChosenSpecialFieldField> = observable.map();

  @observable searchVal?: string;

  @action setSearchVal(data: string) {
    this.searchVal = data;
  }

  @computed get getSearchVal() {
    return this.searchVal;
  }

  @computed get getChosenField() {
    return this.chosenFields;
  }

  @computed get getAllChosenField() {
    return [...this.specialFields.values(), ...this.chosenFields.values()];
  }

  getChosenByCode(code: string) {
    return this.chosenFields.get(code);
  }

  filterFieldBySearchVal = (field: IChosenFieldField) => field.name.indexOf(this.searchVal!) > -1

  @computed get getFields() {
    if (this.searchVal && this.searchVal !== '') {
      return [this.fields.get('system')!.filter(this.filterFieldBySearchVal), this.fields.get('custom')!.filter(this.filterFieldBySearchVal)];
    }
    return [this.fields.get('system')!, this.fields.get('custom')!];
  }

  @computed get getCurrentOptionStatus() {
    return this.currentOptionStatus;
  }

  @action('增添选择字段') addChosenFields(key: string, data: IChosenFieldField) {
    this.chosenFields.set(key, { ...data, value: undefined });
    if (this.chosenFields.size === (this.fields.get('system')!.length + this.fields.get('custom')!.length)) {
      this.currentOptionStatus = 'ALL';
    } else {
      this.currentOptionStatus = 'PART';
    }
  }

  @action('增添特殊选择字段') addSpecialFields(key: string, data: IChosenSpecialFieldField) {
    this.specialFields.set(key, data);
  }

  @action('删除选择字段') delChosenFields(key: string) {
    this.chosenFields.delete(key);
  }

  @action('增添全部字段') addAllChosenFields() {
    //   this.chosenFields.set(key, data);
    const [systemFiled, customFiled] = this.getFields;
    [...systemFiled, ...customFiled].forEach((field) => {
      if (!this.chosenFields.has(field.code) && !this.specialFields.has(field.code)) {
        this.chosenFields.set(field.code, { ...field, value: undefined });
      }
    });
    this.currentOptionStatus = 'ALL';
  }

  @action('取消选择全部字段') cancelAllChosenFields() {
    //   this.chosenFields.set(key, data);

    this.chosenFields.clear();
    this.currentOptionStatus = 'NONE';
  }
}

export default ChoseFieldStore;
