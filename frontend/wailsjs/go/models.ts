export namespace models {
	
	export class Request {
	    ID: string;
	    collection_id: string;
	    name: string;
	    method: string;
	    url: string;
	    headers: string;
	    body: string;
	    auth_config: string;
	    last_response: string;
	    last_status_code: number;
	    last_duration: number;
	    last_headers: string;
	
	    static createFrom(source: any = {}) {
	        return new Request(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.collection_id = source["collection_id"];
	        this.name = source["name"];
	        this.method = source["method"];
	        this.url = source["url"];
	        this.headers = source["headers"];
	        this.body = source["body"];
	        this.auth_config = source["auth_config"];
	        this.last_response = source["last_response"];
	        this.last_status_code = source["last_status_code"];
	        this.last_duration = source["last_duration"];
	        this.last_headers = source["last_headers"];
	    }
	}
	export class Collection {
	    ID: string;
	    name: string;
	    description: string;
	    color: string;
	    order: number;
	    is_collapsed: boolean;
	    requests: Request[];
	    created_at: number;
	    updated_at: number;
	
	    static createFrom(source: any = {}) {
	        return new Collection(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.color = source["color"];
	        this.order = source["order"];
	        this.is_collapsed = source["is_collapsed"];
	        this.requests = this.convertValues(source["requests"], Request);
	        this.created_at = source["created_at"];
	        this.updated_at = source["updated_at"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Environment {
	    ID: string;
	    name: string;
	    variables: string;
	
	    static createFrom(source: any = {}) {
	        return new Environment(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.name = source["name"];
	        this.variables = source["variables"];
	    }
	}

}

export namespace service {
	
	export class ResponseResult {
	    status_code: number;
	    body: string;
	    headers: Record<string, string>;
	    duration: number;
	
	    static createFrom(source: any = {}) {
	        return new ResponseResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.status_code = source["status_code"];
	        this.body = source["body"];
	        this.headers = source["headers"];
	        this.duration = source["duration"];
	    }
	}

}

