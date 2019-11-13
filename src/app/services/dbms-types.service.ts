import {EventEmitter, Injectable} from '@angular/core';
import {CrudService} from './crud.service';
import {ResultSet} from '../components/data-table/models/result-set.model';
import {ToastService} from '../components/toast/toast.service';

@Injectable({
  providedIn: 'root'
})
export class DbmsTypesService {

  private numericArray = ['int2','int4','int8','integer','bigint','smallint','float','float4','float8','double'];
  private booleanArray = ['bool', 'boolean'];
  private types = new EventEmitter();
  private foreignKeyActions = new EventEmitter();

  constructor(
    private _crud: CrudService,
    private _toast: ToastService
  ) {
    this.fetchTypes();
    this.fetchFkActions();
  }

  /**
   * Fetches all supported data types of the DBMS.
   */
  private fetchTypes() {
    this._crud.getTypeInfo().subscribe(
      res=> {
        const result = <ResultSet> res;
        if( result.error ){
          this._toast.toast( 'server error', 'Could not retrieve DBMS types.', 10, 'bg-danger' );
          return;
        }
        const types = [];
        result.data.forEach( (v, i) => {
          types.push(v[0]);
        });
        types.sort();
        this.types.next( types );
      }, err => {
        this._toast.toast( 'server error', 'Could not retrieve DBMS types.', 10, 'bg-danger' );
      }
    );

  }

  /**
   * Fetch available actions for foreign key constraints
   */
  private fetchFkActions(){
    this._crud.getFkActions().subscribe(
      res => {
        this.foreignKeyActions.next( res );
      }, err => {
        this._toast.toast( 'server error', 'Could not retrieve DBMS foreign key actions.', 10, 'bg-danger' );
    }
    );
  }

  /**
   * @return EventEmitter with the available foreign key actions
   */
  getFkActions(){
    return this.foreignKeyActions;
  }

  /**
   * @return EventEmitter with the available DBMS data types
   */
  getTypes() {
    this.fetchTypes();
    return this.types;
  }

  /**
   * for ngIf and ngSwitchCase
   * usage: _types.numericTypes().includes( val )
   */
  numericTypes () {
    return this.numericArray;
  }

  /**
   * for ngIf and ngSwitchCase
   * usage: _types.booleanTypes().includes( val )
   */
  booleanTypes () {
    return this.booleanArray;
  }

  /**
   * @param type dmbs type name
   * @return if the dbms type is numeric
   */
  isNumeric ( type: string ){
    return this.numericArray.includes( type.toLowerCase() );
  }

  /**
   * @param type dmbs type name
   * @return if the dbms type is of boolean type
   */
  isBoolean ( type: string ) {
    return this.booleanArray.includes( type.toLowerCase() );
  }

}