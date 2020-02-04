import Fiber from 'fibers';
import Future from 'fibers/future';

import DbRecord2 from "advers-dbrecord2";
import MysqlDatabase from "./MysqlDatabase";

type TransactionCallback = (me: DbRecordFibers) => Promise<boolean>;
type ForeachCallback = (item: DbRecordFibers, options: DbRecord2.ForEachOptions) => void;

/**
 * The database active record class.
**/
class DbRecordFibers {
	static _table(): string { throw "DbRecord can't be created directly"; }
	static _locatefield(): string { throw "DbRecord can't be created directly"; }
	static _keys(): string[] { return []; }

	dbrecord: DbRecord2 = null;

	/**
	 * @inheritdoc
	 */
	constructor(options?: DbRecord2.ObjectInitializer) {
		const future = new Future();

		// Create dbrecord holder and adjust its properties
		this.dbrecord = new DbRecord2(options);
		this.dbrecord._tableName = (this.constructor as any)._table();
		this.dbrecord._locateField = (this.constructor as any)._locatefield();
		this.dbrecord._keysList = (this.constructor as any)._keys();

		return Future.fromPromise(this.dbrecord.init());
	}

	/**
	 * Tries creating an object by locate field/keys. Unlike constructor, does
	 * not throw an error for non-existing record and returns null instead.
	 * @param options
	 */
	static tryCreate<T extends DbRecordFibers>(this: { new({}): T }, options: DbRecord2.ObjectInitializer = {}): T {
		try {
			return new this(options);
		} catch(ex) {
			if(ex.message == "E_DB_NO_OBJECT") { return null; }
			else { throw ex; }
		}
	}


	/** Creates a new database record, populating it from the fields list
	 * @param {Object} fields
	 * @param {Object} [options] - options for database creation
	 * @returns {DbRecord} the newly created object
	 */
	static newRecord(fields, options = {}) {
		const future = new Future();
		DbRecord2.newRecord(fields, options)
			.then(res => future.return(res))
			.catch(err => { future.throw(err) });
		return future.wait();
	}

	/**
	 * Save accumulated changed fields, if any
	 */
	commit(options: DbRecord2.CommitOptions = {}): void {
		// If called without a fiber, fall to super
		if(Fiber.current === undefined) {
			this.dbrecord.commit(options);
		}

		const future = new Future();
		this.dbrecord.commit()
			.then(res => future.return(res))
			.catch(err => { future.throw(err) });
		return future.wait();
	}


	/**
	 * Removes the record from the database. No verification or integrity checks
	 * are being performed, they are up to caller.
	 */
	deleteRecord() {
		const future = new Future();
		this.dbrecord.deleteRecord()
			.then(res => future.return(res))
			.catch(err => { future.throw(err) });
		return future.wait();
	}


	/**
	 * @inheritdoc DbRecord2.forEach
	 */
	static forEach(options: DbRecord2.ForEachOptions, cb: ForeachCallback) {
		const asyncCb = async (item: DbRecord2, options: DbRecord2.ForEachOptions) => {
			const init: DbRecord2.ObjectInitializer = {};
			init[this._locatefield()] = options.raw[this._locatefield()];

			const obj = new this(init);
			cb(obj, options);
		};

		const opts = Object.assign({}, options);
		opts.noObjectCreate = true;
		opts.provideRaw = true;

		Future.fromPromise(
			DbRecord2.forEach(opts, asyncCb)
		).wait();
	}

	/**
	 * @inheritdoc
	 */
	transactionWithMe(cb: TransactionCallback): void {
		const Class = (this.dbrecord.constructor as any);

		const p = this.dbrecord.transactionWithMe(async (dbrecord2: DbRecord2 ) => {
			const init: DbRecord2.ObjectInitializer = {};
			const loc: string = (Class as any)._locatefield();
			init[loc] = dbrecord2[loc]();

			// TODO: fix unnecessary dbrecord2 creation above
			const me = new (Class as any)(init);
			return cb(me);
		});

		// Re-read our object after the transaction
		Future.fromPromise(p).wait();
	}
}

namespace DbRecordFibers {
	export import ObjectInitializer = DbRecord2.ObjectInitializer;
	export import ForEachOptions = DbRecord2.ForEachOptions;

	export import Column = DbRecord2.Column;
}

export = DbRecordFibers;
