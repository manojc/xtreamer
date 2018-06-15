export class Config {

    public constructor(url: string, batchSize?: number) {
        this.url = url;
        this.batchSize = batchSize;
    }

    private _url: string;
    public get url(): string {
        return this._url;
    }
    public set url(v: string) {
        this._url = v;
    }


    private _batchSize: number;
    public get batchSize(): number {
        return this._batchSize;
    }
    public set batchSize(v: number) {
        this._batchSize = v;
    }

    public onDataCallBack: (error: any, data: any) => void;

    public onEndCallBack: (error: any) => void;

    public onErrorCallBack: (error: any) => void;
}