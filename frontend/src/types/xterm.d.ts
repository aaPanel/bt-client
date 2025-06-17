export interface hostProps {
	[key: string]: string | number;
	host: string;
	port?: number;
	username?: string;
	password?: string;
	pkey?: string;
	pkey_passwd?: string;
	ps: string;
}