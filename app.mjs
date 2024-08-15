import { createServer } from 'http';
import { readFile } from 'fs';
import { extname as _extname } from 'path';
import Database from 'better-sqlite3';

const db = new Database('data.db');
db.pragma('journal_mode = WAL');

const pathIndex = './public/index.html';
const pathFavicon = './public/favicon.ico';

const contentTypeHtml = { 'Content-Type': 'text/html' };
const contentTypeIcon = { 'Content-Type': 'image/x-icon' };

createServer((req, res) => {
	const GET = req.method === 'GET';
	const POST = req.method === 'POST';

	if (GET && (req.url === '/' || req.url === '/index.html')) {
		readFile(pathIndex, (_, content) => {
			res.writeHead(200, contentTypeHtml);
			res.end(content, 'utf-8');
		});
	}

	if (GET && req.url === '/favicon.ico') {
		readFile(pathFavicon, (_, content) => {
			res.writeHead(200, contentTypeIcon);
			res.end(content);
		});
	}

	if (GET && req.url === '/timesheets') {
		const data = db
			.prepare('SELECT * FROM timesheets ORDER BY date DESC')
			.all();

		let html = '<table><tr><th>ID</th><th>Date</th><th>Hours</th></tr>';
		for (let i = 0; i < data.length; i++) {
			html += `<tr><td>${data[i].id}</td><td>${data[i].date}</td><td>${data[i].hours}</td></tr>`;
		}
		html += '</table>';

		res.writeHead(200, contentTypeHtml);
		res.end(html, 'utf-8');
	}

	if (POST && req.url === '/timesheets') {
		let body = '';
		req.on('data', (chunk) => (body += chunk.toString()));
		req.on('end', () => {
			const parts = body.split('&');
			const date = parts[0].split('=')[1];
			const hours = parts[1].split('=')[1];

			const insertData = db.prepare('INSERT INTO timesheets (date, hours) VALUES (?, ?)');
			insertData.run(date, hours);

			res.writeHead(201, contentTypeHtml);
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

	// const insertData = db.prepare('INSERT INTO timesheets (date, hours) VALUES (?, ?)');
	// insertData.run('2024-08-14', 6);
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

initDb();
console.log('Server running at http://127.0.0.1:8080/');
