import DbRecord2 from "advers-dbrecord2";
declare type TransactionCallback = (me: DbRecordFibers) => Promise<boolean>;
declare type ForeachCallback = (item: DbRecordFibers, options: DbRecord2.ForEachOptions) => void;
/**
 * The database active record class.
**/
declare class DbRecordFibers {
    static _table(): string;
    static _locatefield(): string;
    static _keys(): string[];
    dbrecord: DbRecord2;
    /**
     * @inheritdoc
     */
    constructor(options?: DbRecord2.ObjectInitializer);
    /**
     * Tries creating an object by locate field/keys. Unlike constructor, does
     * not throw an error for non-existing record and returns null instead.
     * @param options
     */
    static tryCreate<T extends DbRecordFibers>(this: {
        new ({}: {}): T;
    }, options?: DbRecord2.ObjectInitializer): T;
    /** Creates a new database record, populating it from the fields list
     * @param {Object} fields
     * @param {Object} [options] - options for database creation
     * @returns {DbRecord} the newly created object
     */
    static newRecord(fields: any, options?: {}): any;
    /**
     * Save accumulated changed fields, if any
     */
    commit(options?: DbRecord2.CommitOptions): void;
    /**
     * Removes the record from the database. No verification or integrity checks
     * are being performed, they are up to caller.
     */
    deleteRecord(): any;
    /**
     * @inheritdoc DbRecord2.forEach
     */
    static forEach(options: DbRecord2.ForEachOptions, cb: ForeachCallback): void;
    /**
     * @inheritdoc
     */
    transactionWithMe(cb: TransactionCallback): void;
}
declare namespace DbRecordFibers {
    export import ObjectInitializer = DbRecord2.ObjectInitializer;
    export import ForEachOptions = DbRecord2.ForEachOptions;
    export import Column = DbRecord2.Column;
}
export = DbRecordFibers;
