import { createServer } from 'http';
import { readFile } from 'fs';
import { extname as _extname } from 'path';
import Database from 'better-sqlite3';

const db = new Database('data.db');
db.pragma('journal_mode = WAL');

createServer((req, res) => {
	const mimeHtml = { 'Content-Type': 'text/html' };
	const mimeCss = { 'Content-Type': 'text/css' };
	const mimeIcon = { 'Content-Type': 'image/x-icon' };

	const GET = req.method === 'GET';
	const POST = req.method === 'POST';

	if (GET && req.url === '/') {
		readFile('./public/index.html', (_, content) => {
			res.writeHead(200, mimeHtml);
			res.end(content, 'utf-8');
		});
	}

	if (GET && req.url === '/style.css') {
		readFile('./public/style.css', (_, content) => {
			res.writeHead(200, mimeCss);
			res.end(content);
		});
	}

	if (GET && req.url === '/favicon.ico') {
		readFile('./public/favicon.ico', (_, content) => {
			res.writeHead(200, mimeIcon);
			res.end(content);
		});
	}

	if (GET && req.url === '/timesheets') {
		const html = getTimesheetsHtml();
		res.writeHead(200, mimeHtml);
		res.end(html, 'utf-8');
	}

	if (POST && req.url === '/timesheets') {
		let body = '';
		req.on('data', (chunk) => (body += chunk.toString()));
		req.on('end', () => {
			insertTimesheet(body);
			res.writeHead(201, mimeHtml);
			res.end('<span>Created</span>', 'utf-8');
		});
	}

	logRequest(req, res);
}).listen(8080);

const logRequest = (req, res) => {
	console.log(`${res.statusCode} | ${padRt(req.method, 4)} | ${req.url}`);
};

const initDb = () => {
	const createTable = `
		CREATE TABLE IF NOT EXISTS timesheets (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			date TEXT NOT NULL,
			hours INTEGER NOT NULL
		)
	`;
	db.exec(createTable);
};

const padRt = (str, length) => {
	const char = ' ';
	const padLen = length - str.length;
	if (padLen <= 0) {
		return str;
	}
	const padding = char.repeat(padLen);
	return str + padding;
}

const getTimesheetsHtml = () => {
	const data = db
		.prepare('SELECT * FROM timesheets ORDER BY date DESC')
		.all();

	let html = `
		<table>
			<tr>
				<th>ID</th>
				<th>Date</th>
				<th>Hours</th>
			</tr>`;
	for (let i = 0; i < data.length; i++) {
		html += `
			<tr>
				<td>${data[i].id}</td>
				<td>${data[i].date}</td>
				<td>${data[i].hours}</td>
			</tr>`;
	}
	html += '</table>';
	return html;
};

const insertTimesheet = (body) => {
	const parts = body.split('&');
	const date = parts[0].split('=')[1];
	const hours = parts[1].split('=')[1];

	const insert = db.prepare('INSERT INTO timesheets (date, hours) VALUES (?, ?)');
	insert.run(date, hours);
};

initDb();
console.log('Server running at http://127.0.0.1:8080/');
