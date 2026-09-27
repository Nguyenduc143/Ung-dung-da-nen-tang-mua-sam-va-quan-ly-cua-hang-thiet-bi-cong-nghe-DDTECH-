// Run after npm run build. Uses the configured MySQL database; removes only test-owned rows.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { app } = require('../dist/app');
const { pool } = require('../dist/config/database');
const { removeStoredCategoryImageByUrl } = require('../dist/services/upload.service');
const { signAccessToken } = require('../dist/utils/token');

(async () => {
  const prefix = `test05-${randomUUID()}`;
  const users = [], categories = [], brands = [];
  const categoryImageUrls = [];
  let server;
  try {
    for (const role of ['ADMIN', 'CUSTOMER']) {
      const [r] = await pool.execute("INSERT INTO users(full_name,email,password_hash,role) VALUES (?,?,?,?)", [prefix, `${prefix}-${role}@example.invalid`, 'test-only-no-login', role]);
      users.push(r.insertId);
    }
    server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const admin = signAccessToken({id:users[0],role:'ADMIN'});
    const customer = signAccessToken({id:users[1],role:'CUSTOMER'});
    async function request(method, path, body, token, expected = 200) {
      const r = await fetch(base + path, {method, headers:{'content-type':'application/json', ...(token ? {authorization:`Bearer ${token}`} : {})}, body:body === undefined ? undefined : JSON.stringify(body)});
      const json = await r.json();
      assert.equal(r.status, expected, `${method} ${path}: ${JSON.stringify(json)}`);
      return json.data;
    }
    async function requestForm(method, path, formData, token, expected = 200) {
      const r = await fetch(base + path, {
        method,
        headers: token ? {authorization:`Bearer ${token}`} : {},
        body: formData,
      });
      const json = await r.json();
      assert.equal(r.status, expected, `${method} ${path}: ${JSON.stringify(json)}`);
      return json.data;
    }
    await request('GET','/categories');
    await request('GET','/brands');
    await request('GET','/admin/categories',undefined,undefined,401);
    await request('GET','/admin/brands',undefined,customer,403);
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );
    const createCategoryForm = new FormData();
    createCategoryForm.append('image', new Blob([png], {type:'image/png'}), 'category.png');
    createCategoryForm.append('name', `Điện thoại ${prefix}`);
    createCategoryForm.append('sortOrder', '1');
    createCategoryForm.append('status', 'ACTIVE');
    const a = await requestForm('POST','/admin/categories/upload',createCategoryForm,admin,201); categories.push(a.id);
    categoryImageUrls.push(a.imageUrl);
    assert.ok(a.slug.startsWith('dien-thoai-'));
    assert.match(a.imageUrl, /\/uploads\/categories\/category-.*\.png$/);
    assert.equal((await fetch(a.imageUrl)).status, 200);
    const updateCategoryForm = new FormData();
    updateCategoryForm.append('image', new Blob([png], {type:'image/png'}), 'category-new.png');
    updateCategoryForm.append('name', a.name);
    const updatedA = await requestForm('PATCH',`/admin/categories/${a.id}/upload`,updateCategoryForm,admin);
    categoryImageUrls.push(updatedA.imageUrl);
    assert.notEqual(updatedA.imageUrl, a.imageUrl);
    assert.equal((await fetch(a.imageUrl)).status, 404);
    assert.equal((await fetch(updatedA.imageUrl)).status, 200);
    const b = await request('POST','/admin/categories',{name:prefix+' child',parentId:a.id},admin,201); categories.push(b.id);
    await request('PATCH',`/admin/categories/${a.id}`,{parentId:b.id},admin,409);
    await request('PATCH',`/admin/categories/${a.id}`,{parentId:a.id},admin,409);
    await request('POST','/admin/categories',{name:'duplicate',slug:a.slug},admin,409);
    await request('PATCH',`/admin/categories/${b.id}`,{name:'Changed'},admin);
    await request('GET',`/categories/${a.slug}`);
    const attr = await request('POST',`/admin/categories/${a.id}/attributes`,{attrKey:'storage',attrName:'Dung lượng',inputType:'SELECT',options:['128','256']},admin,201);
    await request('POST',`/admin/categories/${a.id}/attributes`,{attrKey:'storage',attrName:'Duplicate'},admin,409);
    await request('PATCH',`/admin/category-attributes/${attr.id}`,{options:null},admin,422);
    await request('PATCH',`/admin/category-attributes/${attr.id}`,{attrName:'Bộ nhớ',options:['512']},admin);
    const attrs = await request('GET',`/admin/categories/${a.id}/attributes`,undefined,admin);
    assert.deepEqual(attrs.find(x=>x.id===attr.id).options,['512']);
    await request('DELETE',`/admin/category-attributes/${attr.id}`,undefined,admin);
    await request('PATCH',`/admin/categories/${a.id}`,{status:'HIDDEN'},admin);
    await request('GET',`/categories/${a.slug}`,undefined,undefined,404);
    assert.ok(!(await request('GET','/categories')).some(x=>x.id===a.id));
    assert.ok((await request('GET','/admin/categories',undefined,admin)).some(x=>x.id===a.id));
    const brand = await request('POST','/admin/brands',{name:prefix,logoUrl:'https://example.com/logo.png'},admin,201); brands.push(brand.id);
    await request('GET',`/brands/${brand.slug}`);
    await request('POST','/admin/brands',{name:'Duplicate',slug:brand.slug},admin,409);
    await request('PATCH',`/admin/brands/${brand.id}`,{description:'Updated'},admin);
    await request('DELETE',`/admin/brands/${brand.id}`,undefined,admin);
    await request('GET',`/brands/${brand.slug}`,undefined,undefined,404);
    for (const id of [b.id,a.id]) await request('DELETE',`/admin/categories/${id}`,undefined,admin);
    assert.equal((await fetch(updatedA.imageUrl)).status, 404);
    const [rows] = await pool.execute('SELECT deleted_at FROM categories WHERE id = ?', [a.id]);
    assert.ok(rows[0].deleted_at);
    await pool.execute("UPDATE users SET status='LOCKED' WHERE id=?", [users[0]]);
    await request('GET','/admin/categories',undefined,admin,401);
    console.log('PASS: catalog CRUD, slug, visibility, ownership of admin role, cycle checks, attribute validation, soft delete');
  } finally {
    if (server) { server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); }
    for (const id of categories.reverse()) {
      await pool.execute('DELETE FROM category_attributes WHERE category_id=?',[id]);
      await pool.execute('DELETE FROM categories WHERE id=?',[id]);
    }
    for (const id of brands) await pool.execute('DELETE FROM brands WHERE id=?',[id]);
    for (const id of users) await pool.execute('DELETE FROM users WHERE id=? AND full_name=?',[id,prefix]);
    for (const imageUrl of categoryImageUrls) await removeStoredCategoryImageByUrl(imageUrl);
    await pool.end();
  }
})().catch(error => { console.error(error); process.exitCode=1; });
