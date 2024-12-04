
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  try {
  
    await import('./init.js');
    console.log('Init completed');
    await delay(500);  

    await import('./Query1.js');
    console.log('Query 1 completed');
    await delay(500);  

    await import('./Query2.js');
    console.log('Query 2 completed');
    await delay(500);  

    await import('./Query3.js');
    console.log('Query 3 completed');
    await delay(500);  

    await import('./Query4.js');
    console.log('Query 4 completed');
    await delay(500);  

    await import('./Query5.js');
    console.log('Query 5 completed');
    await delay(500);  

  } catch (err) {
    console.error('Error occurred:', err);
  }
})();


