/* Harbor Mind openings: stands in for the job-board embed. Mounts an iframe in #grnhse_app (the page's
   loading skeleton hides itself once the box holds an iframe) and sizes it to the list's height. */
(function () {
  function mount() {
    var box = document.getElementById('grnhse_app');
    if (!box) return setTimeout(mount, 200);
    if (box.querySelector('iframe')) return;
    var f = document.createElement('iframe');
    f.src = '/media/jobs';
    f.title = 'Current openings at Harbor Mind';
    f.style.cssText = 'width:100%;border:0;display:block;height:760px';
    box.appendChild(f);
    window.addEventListener('message', function (e) {
      if (e.origin === location.origin && e.data && e.data.hmJobsHeight) f.style.height = e.data.hmJobsHeight + 'px';
    });
  }
  mount();
})();
