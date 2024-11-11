declare module 'firebase-admin' {
  import { Timestamp, FieldValue } from 'firebase-admin/firestore';
  export { Timestamp, FieldValue };
}
declare module 'firebase-admin/app';
declare module 'firebase-admin/firestore' {
  export interface Timestamp {
    seconds: number;
    nanoseconds: number;
    toDate(): Date;
    toMillis(): number;
  }

  export interface FieldValue {
    isEqual(other: FieldValue): boolean;
  }

  export interface WriteResult {
    writeTime: Timestamp;
  }

  export interface DocumentData {
    [field: string]: any;
  }

  export interface QueryDocumentSnapshot<T = DocumentData> {
    id: string;
    exists: boolean;
    ref: DocumentReference<T>;
    data(): T;
  }

  export interface DocumentReference<T = DocumentData> {
    id: string;
    path: string;
    parent: CollectionReference<T>;
    collection(collectionPath: string): CollectionReference;
    get(): Promise<DocumentSnapshot<T>>;
    set(data: Partial<T>, options?: { merge?: boolean }): Promise<WriteResult>;
    update(data: Partial<T>): Promise<WriteResult>;
    delete(): Promise<WriteResult>;
  }

  export interface CollectionReference<T = DocumentData> extends Query<T> {
    id: string;
    path: string;
    parent: DocumentReference | null;
    doc(documentPath?: string): DocumentReference<T>;
    add(data: T): Promise<DocumentReference<T>>;
  }

  export interface Query<T = DocumentData> {
    where(
      fieldPath: string | FieldPath,
      opStr: WhereFilterOp,
      value: any
    ): Query<T>;
    orderBy(
      fieldPath: string | FieldPath,
      directionStr?: OrderByDirection
    ): Query<T>;
    limit(limit: number): Query<T>;
    offset(offset: number): Query<T>;
    get(): Promise<QuerySnapshot<T>>;
  }

  export interface QuerySnapshot<T = DocumentData> {
    docs: Array<QueryDocumentSnapshot<T>>;
    empty: boolean;
    size: number;
    forEach(callback: (result: QueryDocumentSnapshot<T>) => void): void;
  }

  export interface DocumentSnapshot<T = DocumentData> {
    id: string;
    ref: DocumentReference<T>;
    exists: boolean;
    data(): T | undefined;
    get(fieldPath: string | FieldPath): any;
  }

  export interface FirebaseFirestore {
    collection<T = DocumentData>(path: string): CollectionReference<T>;
    doc<T = DocumentData>(path: string): DocumentReference<T>;
    runTransaction<T>(
      updateFunction: (transaction: Transaction) => Promise<T>
    ): Promise<T>;
    batch(): WriteBatch;
  }

  export type WhereFilterOp =
    | '<'
    | '<='
    | '=='
    | '!='
    | '>='
    | '>'
    | 'array-contains'
    | 'array-contains-any'
    | 'in'
    | 'not-in';

  export type OrderByDirection = 'desc' | 'asc';

  export class FieldPath {
    constructor(...segments: string[]);
    static documentId(): FieldPath;
  }

  export function getFirestore(): FirebaseFirestore;

  export interface Transaction {
    get<T>(ref: DocumentReference<T>): Promise<DocumentSnapshot<T>>;
    set<T>(ref: DocumentReference<T>, data: T, options?: { merge?: boolean }): Transaction;
    update(ref: DocumentReference<any>, data: UpdateData): Transaction;
    update(ref: DocumentReference<any>, field: string | FieldPath, value: any, ...moreFieldsAndValues: any[]): Transaction;
    delete(ref: DocumentReference<any>): Transaction;
  }

  export interface WriteBatch {
    set<T>(ref: DocumentReference<T>, data: T, options?: { merge?: boolean }): WriteBatch;
    update(ref: DocumentReference<any>, data: UpdateData): WriteBatch;
    update(ref: DocumentReference<any>, field: string | FieldPath, value: any, ...moreFieldsAndValues: any[]): WriteBatch;
    delete(ref: DocumentReference<any>): WriteBatch;
    commit(): Promise<WriteResult[]>;
  }

  export interface UpdateData {
    [fieldPath: string]: any;
  }
}

declare module 'firebase-admin/auth' {
  export interface UserRecord {
    uid: string;
    email?: string;
    emailVerified: boolean;
    displayName?: string;
    photoURL?: string;
    disabled: boolean;
    metadata: {
      creationTime: string;
      lastSignInTime: string;
      lastRefreshTime: string;
    };
    providerData: UserInfo[];
    customClaims?: { [key: string]: any };
    tokensValidAfterTime?: string;
    tenantId?: string;
  }

  export interface UserInfo {
    uid: string;
    displayName?: string;
    email?: string;
    phoneNumber?: string;
    photoURL?: string;
    providerId: string;
  }

  export interface CreateRequest {
    uid?: string;
    email?: string;
    emailVerified?: boolean;
    phoneNumber?: string;
    password?: string;
    displayName?: string;
    photoURL?: string;
    disabled?: boolean;
  }

  export interface Auth {
    createCustomToken(uid: string, claims?: object): Promise<string>;
    verifyIdToken(idToken: string, checkRevoked?: boolean): Promise<DecodedIdToken>;
    createUser(properties: CreateRequest): Promise<UserRecord>;
    updateUser(uid: string, properties: UpdateRequest): Promise<UserRecord>;
    deleteUser(uid: string): Promise<void>;
    getUser(uid: string): Promise<UserRecord>;
    getUserByEmail(email: string): Promise<UserRecord>;
    getUserByPhoneNumber(phoneNumber: string): Promise<UserRecord>;
    listUsers(maxResults?: number, pageToken?: string): Promise<ListUsersResult>;
    setCustomUserClaims(uid: string, customUserClaims: object | null): Promise<void>;
    revokeRefreshTokens(uid: string): Promise<void>;
  }

  export function getAuth(): Auth;
}