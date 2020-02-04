
export default class TestRecord {
	constructor(any?) {}

	managed_field: (any?) => string;
	name: (any?) => string;

	unique_field: (any?) => string;
	field2: (any?) => string;
	field3: (any?) => string;

	_tableName: string;

	static createMockTable(any) {}
	static tryCreate(any): TestRecord { return new TestRecord(); }
	commit(){}
	static _table(){}
	deleteRecord(){}
	static newRecord({}): TestRecord { return new TestRecord(); }
}
