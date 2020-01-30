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
	constructor(options: DbRecord2.DbRecordOptions = {}) {
		const future = new Future();

		this.dbrecord = new DbRecord2(options);
		this.dbrecord._tableName

		this.dbrecord.init()
			.then(res => future.return(res))
			.catch(err => { future.throw(err) });
		return future.wait();
	}

	/**
	 * Tries creating an object by locate field/keys. Unlike constructor, does
	 * not throw an error for non-existing record and returns null instead.
	 * @param options
	 */
	static tryCreate(options: DbRecord2.DbRecordOptions = {}) {
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
			const o = {};
			o[this._locatefield()] = row[this._locatefield()];

			const obj = new
		};

		const opts = Object.assign({}, options);
		opts.noObjectCreate = true;
		opts.provideRaw = true;
		DbRecord2.forEach(opts, asyncCb);

		const where = [];
		const qparam = [];
		const sql = DbRecord2._prepareForEach(options, where, qparam);

		//
		// Iterate
		const _dbh =  this._getDbhClassStatic().masterDbh();

		/*
		if(TARGET === "development") {
			console.log(`${_dbh._db.threadId}: will be running forEach query`);
		}
		*/

		const rows = _dbh.querySync(sql, qparam);
		options.TOTAL = rows.length;

		if(cb) {
			options.COUNTER = 0;

			for(const row of rows) {
				options.COUNTER++;

				const o = {};
				o[this._locatefield()] = row[this._locatefield()];
				const obj = new this(o);

				// Wait for iterator to end
				cb(obj, options);
			}
		} else {
			options.COUNTER = options.TOTAL;
		}

		return options.COUNTER;
	}

	// Helper functions

	/**
	 * Add value to mysql SET field
	 * @param currentValue
	 * @param newValue
	 */
	static setFieldSet(currentValue, newValue) {
		const parts = (typeof(currentValue) === "string" && currentValue !== "")?
			currentValue.split(","):
			[];
		parts.push(newValue);
		return parts.join(",");
	}

	/**
	 * Remove value from mysql SET field
	 * @param currentValue
	 * @param toRemove
	 */
	static setFieldRemove(currentValue, toRemove) {
		let parts = (typeof(currentValue) === "string")? currentValue.split(","): [];
		parts = parts.filter(v => v !== toRemove);
		return parts.join(",");
	}

	/**
	 * Check if value in in mysql SET field
	 * @param currentValue
	 * @param toRemove
	 */
	static setFieldCheck(currentValue, check) {
		const parts = (typeof(currentValue) === "string")? currentValue.split(","): [];
		return parts.includes(check);
	}

	/**
	 * @inheritdoc
	 */
	transactionWithMe(cb: TransactionCallback): void {
		const Class = this.constructor;

		const dbh = Class.masterDbh();
		dbh.execTransaction(() => {
			const params = {};
			params[this._locateField] = this[this._locateField]();
			const me = new (this.constructor as any)(params);

			return cb(me);
		});

		// Re-read our object after the transaction
		Future.fromPromise(
			this._read(this[this._locateField]())
		).wait();
	}

}

export = DbRecordFibers;
