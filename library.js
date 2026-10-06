// library.js - shared data helpers for books and loans (Firestore)
import { db } from "./firebase-init.js";
import { collection, getDocs, query, where, doc, runTransaction, Timestamp }
    from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

/* PLACEHOLDER RULES - confirm with the librarian, then change here only. */
export const RULES = { maxBooks: 3, loanDays: 7, dueSoonDays: 2 };

export const $ = id => document.getElementById(id);

export function el(tag, text, cls) {
    var e = document.createElement(tag);
    if (text != null) e.textContent = text;
    if (cls) e.className = cls;
    return e;
}

export function fillTable(tbody, rows, emptyMsg) {
    tbody.replaceChildren();
    if (!rows.length) {
        var tr = document.createElement("tr"), td = el("td", emptyMsg);
        td.colSpan = 99; tr.append(td); tbody.append(tr); return;
    }
    rows.forEach(function (cells) {
        var tr = document.createElement("tr");
        cells.forEach(function (c) {
            var td = document.createElement("td");
            td.append(c instanceof Node ? c : String(c == null ? "" : c));
            tr.append(td);
        });
        tbody.append(tr);
    });
}

export const fmt = t => t ? t.toDate().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "---";
export const shortId = id => id.slice(0, 6).toUpperCase();

export function loanState(l) {
    if (l.status === "returned") return "Returned";
    var left = l.dueAt.toMillis() - Date.now();
    if (left < 0) return "Overdue";
    if (left <= RULES.dueSoonDays * 864e5) return "Due Soon";
    return "Borrowed";
}

export function loanBadge(l) {
    var s = loanState(l);
    var cls = { "Borrowed": "status-borrowed", "Due Soon": "status-due", "Overdue": "overdue", "Returned": "returned" }[s];
    return el("span", s, cls);
}

export function stockBadge(b) {
    return b.availableCopies > 0 ? el("span", "Available", "available") : el("span", "Borrowed", "borrowed");
}

const byNewest = (a, b) => b.borrowedAt.toMillis() - a.borrowedAt.toMillis();

export async function getBooks() {
    var s = await getDocs(collection(db, "books"));
    return s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.title.localeCompare(b.title));
}

export async function getMyLoans(uid) {
    var s = await getDocs(query(collection(db, "loans"), where("uid", "==", uid)));
    return s.docs.map(d => ({ id: d.id, ...d.data() })).sort(byNewest);
}

export async function getAllLoans() {
    var s = await getDocs(collection(db, "loans"));
    return s.docs.map(d => ({ id: d.id, ...d.data() })).sort(byNewest);
}

export async function borrowBook(book, profile) {
    var active = (await getMyLoans(profile.uid)).filter(l => l.status === "borrowed");
    if (active.length >= RULES.maxBooks) throw new Error("You can borrow at most " + RULES.maxBooks + " books at a time.");
    if (active.some(l => l.bookId === book.id)) throw new Error("You already borrowed this book.");

    var bookRef = doc(db, "books", book.id), loanRef = doc(collection(db, "loans"));
    var due = Timestamp.fromMillis(Date.now() + RULES.loanDays * 864e5);

    await runTransaction(db, async function (tx) {
        var s = await tx.get(bookRef);
        if (!s.exists() || s.data().availableCopies < 1) throw new Error("No copies are available right now.");
        tx.update(bookRef, { availableCopies: s.data().availableCopies - 1 });
        tx.set(loanRef, {
            uid: profile.uid, studentName: profile.fullname || profile.username, studentId: profile.studentid || "",
            bookId: book.id, title: book.title, author: book.author,
            borrowedAt: Timestamp.now(), dueAt: due, returnedAt: null, status: "borrowed"
        });
    });
    return due;
}

export async function borrowAndReport(book, profile) {
    if (!confirm('Borrow "' + book.title + '" for ' + RULES.loanDays + " days?")) return false;
    try {
        var due = await borrowBook(book, profile);
        alert("Borrowed! Please return it by " + fmt(due) + ".");
        return true;
    } catch (e) { alert(e.message); return false; }
}

export async function returnLoan(loan) {
    var loanRef = doc(db, "loans", loan.id), bookRef = doc(db, "books", loan.bookId);
    await runTransaction(db, async function (tx) {
        var l = await tx.get(loanRef), b = await tx.get(bookRef);
        if (!l.exists() || l.data().status !== "borrowed") throw new Error("This loan is already returned.");
        tx.update(loanRef, { status: "returned", returnedAt: Timestamp.now() });
        if (b.exists()) tx.update(bookRef, { availableCopies: b.data().availableCopies + 1 });
    });
}
