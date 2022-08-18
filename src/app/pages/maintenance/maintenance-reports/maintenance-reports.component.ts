import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastEvokeService } from '@costlydeveloper/ngx-awesome-popup';
import { DataItem } from '@swimlane/ngx-charts';
import { Workbook } from 'exceljs';
import * as FileSaver from 'file-saver';
import { PdfMakeWrapper, Table } from 'pdfmake-wrapper';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { IResponseGenre } from '../../../commons/services/api/genre/genre-api-model.interface';
import { GenreApiService } from '../../../commons/services/api/genre/genre-api.service';
import { IResponseReportSale } from '../../../commons/services/api/reports/reports-api-model.interface';
import { ReportsApiService } from '../../../commons/services/api/reports/reports-api.service';

PdfMakeWrapper.setFonts(pdfFonts);
const pdf = new PdfMakeWrapper();

@Component({
	selector: 'app-maintenance-reports',
	templateUrl: './maintenance-reports.component.html',
	styleUrls: ['./maintenance-reports.component.scss']
})
export class MaintenanceReportsComponent implements OnInit {
	formGroup!: FormGroup;
	listGenres: IResponseGenre[] = [];
	dataPie?: DataItem[];
	showReport = false;

	constructor(
		private _reportsApiService: ReportsApiService,
		private _formBuilder: FormBuilder,
		private _datePipe: DatePipe,
		private _toastEvokeService: ToastEvokeService,
		private _genreApiService: GenreApiService,
		private _currencyPipe: CurrencyPipe
	) {
		this._loadForm();
	}

	ngOnInit(): void {
		this._getGenders();
	}

	clickQuery(): void {
		if (this.formGroup.invalid) {
			this._toastEvokeService.info(
				'Validaciones',
				'Asegurese de seleccionar el genero, la fecha de inicio y la fecha de  fin'
			);
			return;
		}
		this._loadSale();
	}

	private _loadSale() {
		const dateInit = this._datePipe.transform(this.formGroup.get('dateInit')!.value as Date, 'yyyy-MM-dd')!;
		const dateEnd = this._datePipe.transform(this.formGroup.get('dateEnd')!.value as Date, 'yyyy-MM-dd')!;
		const genderId = this.formGroup.get('genre')!.value as number;

		this.showReport = true;

		const demo: IResponseReportSale[] = [
			{
				concertName: 'Juan Babriel',
				totalSale: 1500
			},
			{
				concertName: 'Zion y Lenox',
				totalSale: 8922
			}
		];

		this.dataPie = demo.map((item) => ({ name: item.concertName, value: item.totalSale }));

		this._reportsApiService.getDataSale(dateInit, dateEnd, genderId).subscribe((response) => {
			console.log(response);
		});
	}

	generatePdf(): void {
		const data = this.dataPie!.map((item) => {
			const mount = this._currencyPipe.transform(item.value, '2.2');
			return [item.name, mount];
		});

		const table = new Table(data).widths(['*', 100]).end;

		pdf.info({ title: 'Reporte MitoCode' });
		pdf.add('Reporte de Ventas');
		pdf.add(table);
		pdf.create().download('reporte de venta');
	}

	generateExcel(): void {
		const workbook = new Workbook();
		const worksheet = workbook.addWorksheet('Reporte de Ventas');

		const dataForExcel = this.dataPie!.map((item) => [item.name.toString(), `${item.value}`]);

		worksheet.addRow(['Evento', 'Total ventas']);
		worksheet.addRows(dataForExcel);

		void workbook.xlsx.writeBuffer().then((data) => {
			const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
			FileSaver(blob, 'reporte de ventas');
		});
	}

	clickClear(): void {
		this.formGroup.reset();
		this.showReport = false;
	}

	private _loadForm(): void {
		this.formGroup = this._formBuilder.group({
			genre: [null, Validators.required],
			dateInit: [null, Validators.required],
			dateEnd: [null, Validators.required]
		});
	}

	private _getGenders(): void {
		this._genreApiService.getGenres().subscribe((response) => {
			if (response && response.success) {
				this.listGenres = response.result;
			}
		});
	}
}
