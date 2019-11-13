import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {LeftSidebarService} from '../../components/left-sidebar/left-sidebar.service';
import {CrudService} from '../../services/crud.service';
import {Schema, SchemaRequest} from '../../models/ui-request.model';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {SidebarNode} from '../../models/sidebar-node.model';
import {ResultSet} from '../../components/data-table/models/result-set.model';
import {ToastService} from '../../components/toast/toast.service';

@Component({
  selector: 'app-schema-editing',
  templateUrl: './schema-editing.component.html',
  styleUrls: ['./schema-editing.component.scss']
})
export class SchemaEditingComponent implements OnInit, OnDestroy {

  routeParam: string;//either the name of a table (schemaName.tableName) or of a schema (schemaName)
  createForm: FormGroup;
  dropForm: FormGroup;
  schemas: SidebarNode[];
  createSubmitted = false;
  dropSubmitted = false;
  createSchemaFeedback = 'Schema name is invalid';

  constructor(
    private _route: ActivatedRoute,
    private _leftSidebar: LeftSidebarService,
    private _crud: CrudService,
    private _toast: ToastService
  ) { }

  ngOnInit() {

    this.getRouteParam();
    this.getSchema();
    this.initForms();

  }

  ngOnDestroy() {
    this._leftSidebar.close();
  }

  getRouteParam () {
    this.routeParam = this._route.snapshot.paramMap.get('id');
    this._route.params.subscribe((params) => {
      this.routeParam = params['id'];
    });
  }

  public getSchema () {
    this._leftSidebar.setSchema( new SchemaRequest('/views/schema-editing/', false, 2) );
    this._crud.getSchema(new SchemaRequest('/views/schema-editing/', false, 1)).subscribe(
      res => {
        this.schemas = <SidebarNode[]> res;
      }, err => {
        console.log(err);
      }
    );
  }

  initForms(){
    this.createForm = new FormGroup({
      name: new FormControl('', this._crud.getNameValidator( true ) ),
      type: new FormControl('relational', Validators.required)
    });
    this.dropForm = new FormGroup({
      name: new FormControl('', Validators.required),
      cascade: new FormControl()
    });
  }

  resetForm ( formName: string ) {
    switch ( formName ) {
      case 'createForm':
        this.createForm.controls['name'].setValue('');
        this.createForm.markAsPristine();
        break;
      case 'dropForm':
        this.dropForm.controls['name'].setValue('');
        this.dropForm.controls['cascade'].setValue(false);
        this.dropForm.markAsPristine();
        break;
    }
  }

  createSchema(){
    this.createSubmitted = true;
    if( this.createForm.valid && this.createSchemaValidation( this.createForm.controls['name'].value ) === 'is-valid' ){
      const val = this.createForm.value;
      this._crud.createOrDropSchema( new Schema( val.name, val.type ).setCreate( true ) ).subscribe(
        res => {
          const result = <ResultSet> res;
          if( result.error ){
            this._toast.toast( 'error', result.error, 10, 'bg-warning');
          }else{
            this._toast.toast( 'success', 'Created schema ' + val.name, 10, 'bg-success');
            this.getSchema();
          }
          this.createSubmitted = false;
          this.resetForm('createForm');
        }, err => {
          this._toast.toast( 'server error', 'An unknown error occured on the server', 10, 'bg-danger');
        }
      );
    } else {
      this._toast.toast( 'cannot create', this.createSchemaFeedback, 10, 'bg-warning');
    }
  }

  dropSchema(){
    this.dropSubmitted = true;
    if( this.dropForm.valid && this.getValidationClass( this.dropForm.controls['name'].value ) === 'is-valid' ){
      const val = this.dropForm.value;
      this._crud.createOrDropSchema( new Schema( val.name, val.type ).setDrop( true ).setCascade( val.cascade ) ).subscribe(
        res => {
          const result = <ResultSet> res;
          if( result.error ){
            this._toast.toast( 'error', result.error, 10, 'bg-warning');
          }else{
            this._toast.toast( 'success', 'Dropped schema ' + val.name, 10, 'bg-success');
            this.getSchema();
          }
          this.dropSubmitted = false;
          this.resetForm('dropForm');
        }, err => {
          this._toast.toast( 'server error', 'An unknown error occured on the server', 10, 'bg-danger');
        }
      );
    } else {
      this._toast.toast( 'cannot drop', 'This schema does not exist', 10, 'bg-warning');
    }

  }

  getValidationClass( val ){
    if( val === '' ){
      return '';
    } else if ( this.schemas.filter( (o) => o.name === val ).length > 0 ){
      return 'is-valid';
    } else {
      return 'is-invalid';
    }
  }

  createSchemaValidation( name ){
    if( name === '' ){
      return '';
    }
    if( this.schemas ){
      if (this.schemas.filter((o) => o.name === name).length > 0) {
        this.createSchemaFeedback = 'Schema name is already taken';
        return 'is-invalid';
      }else {
        this.createSchemaFeedback = 'Schema name is invalid';
      }
    }
    const regex = this._crud.getValidationRegex();
    if( regex.test( name ) && name.length <= 100 ){
      return 'is-valid';
    } else {
      return 'is-invalid';
    }
  }

}