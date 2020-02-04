"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const fibers_1 = __importDefault(require("fibers"));
const future_1 = __importDefault(require("fibers/future"));
const advers_dbrecord2_1 = __importDefault(require("advers-dbrecord2"));
/**
 * The database active record class.
**/
class DbRecordFibers {
    /**
     * @inheritdoc
     */
    constructor(options) {
        this.dbrecord = null;
        const future = new future_1.default();
        // Create dbrecord holder and adjust its properties
        this.dbrecord = new advers_dbrecord2_1.default(options);
        this.dbrecord._tableName = this.constructor._table();
        this.dbrecord._locateField = this.constructor._locatefield();
        this.dbrecord._keysList = this.constructor._keys();
        return future_1.default.fromPromise(this.dbrecord.init());
    }
    static _table() { throw "DbRecord can't be created directly"; }
    static _locatefield() { throw "DbRecord can't be created directly"; }
    static _keys() { return []; }
    /**
     * Tries creating an object by locate field/keys. Unlike constructor, does
     * not throw an error for non-existing record and returns null instead.
     * @param options
     */
    static tryCreate(options = {}) {
        try {
            return new this(options);
        }
        catch (ex) {
            if (ex.message == "E_DB_NO_OBJECT") {
                return null;
            }
            else {
                throw ex;
            }
        }
    }
    /** Creates a new database record, populating it from the fields list
     * @param {Object} fields
     * @param {Object} [options] - options for database creation
     * @returns {DbRecord} the newly created object
     */
    static newRecord(fields, options = {}) {
        const future = new future_1.default();
        advers_dbrecord2_1.default.newRecord(fields, options)
            .then(res => future.return(res))
            .catch(err => { future.throw(err); });
        return future.wait();
    }
    /**
     * Save accumulated changed fields, if any
     */
    commit(options = {}) {
        // If called without a fiber, fall to super
        if (fibers_1.default.current === undefined) {
            this.dbrecord.commit(options);
        }
        const future = new future_1.default();
        this.dbrecord.commit()
            .then(res => future.return(res))
            .catch(err => { future.throw(err); });
        return future.wait();
    }
    /**
     * Removes the record from the database. No verification or integrity checks
     * are being performed, they are up to caller.
     */
    deleteRecord() {
        const future = new future_1.default();
        this.dbrecord.deleteRecord()
            .then(res => future.return(res))
            .catch(err => { future.throw(err); });
        return future.wait();
    }
    /**
     * @inheritdoc DbRecord2.forEach
     */
    static forEach(options, cb) {
        const asyncCb = async (item, options) => {
            const init = {};
            init[this._locatefield()] = options.raw[this._locatefield()];
            const obj = new this(init);
            cb(obj, options);
        };
        const opts = Object.assign({}, options);
        opts.noObjectCreate = true;
        opts.provideRaw = true;
        future_1.default.fromPromise(advers_dbrecord2_1.default.forEach(opts, asyncCb)).wait();
    }
    /**
     * @inheritdoc
     */
    transactionWithMe(cb) {
        const Class = this.dbrecord.constructor;
        const p = this.dbrecord.transactionWithMe(async (dbrecord2) => {
            const init = {};
            const loc = Class._locatefield();
            init[loc] = dbrecord2[loc]();
            // TODO: fix unnecessary dbrecord2 creation above
            const me = new Class(init);
            return cb(me);
        });
        // Re-read our object after the transaction
        future_1.default.fromPromise(p).wait();
    }
}
(function (DbRecordFibers) {
})(DbRecordFibers || (DbRecordFibers = {}));
module.exports = DbRecordFibers;
//# sourceMappingURL=DbRecordFibers.js.map