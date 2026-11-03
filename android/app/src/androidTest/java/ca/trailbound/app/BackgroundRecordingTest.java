package ca.trailbound.app;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.core.app.ActivityScenario;
import android.content.*;import android.location.*;import android.os.*;
import org.junit.Test;import org.junit.runner.RunWith;import static org.junit.Assert.*;
@RunWith(AndroidJUnit4.class)
public class BackgroundRecordingTest {
 private void shell(String command)throws Exception {try(android.os.ParcelFileDescriptor p=InstrumentationRegistry.getInstrumentation().getUiAutomation().executeShellCommand(command);java.io.InputStream in=new android.os.ParcelFileDescriptor.AutoCloseInputStream(p)){in.readAllBytes();}}
 @Test public void packagedMapsAndExpandedPathsAreReadable()throws Exception {Context c=InstrumentationRegistry.getInstrumentation().getTargetContext();try(java.io.InputStream in=c.getAssets().open("data/canada-paths.json")){org.json.JSONObject paths=new org.json.JSONObject(new String(in.readAllBytes(),java.nio.charset.StandardCharsets.UTF_8));assertTrue(paths.getJSONArray("routes").length()>0);}try(java.io.InputStream in=c.getAssets().open("data/regions/banff.json")){assertEquals("trailbound-region",new org.json.JSONObject(new String(in.readAllBytes(),java.nio.charset.StandardCharsets.UTF_8)).getString("format"));}}

 private String evaluate(ActivityScenario<MainActivity> activity,String script)throws Exception {java.util.concurrent.CountDownLatch latch=new java.util.concurrent.CountDownLatch(1);java.util.concurrent.atomic.AtomicReference<String> result=new java.util.concurrent.atomic.AtomicReference<>("null");activity.onActivity(a->{android.webkit.WebView web=(android.webkit.WebView)((android.view.ViewGroup)a.findViewById(android.R.id.content)).getChildAt(0);web.evaluateJavascript(script,value->{result.set(value);latch.countDown();});});assertTrue(latch.await(5,java.util.concurrent.TimeUnit.SECONDS));return result.get();}
 @Test public void packagedWebUiLoadsExpandedCatalogWithoutInternet()throws Exception {
  shell("svc wifi disable");shell("svc data disable");
  try(ActivityScenario<MainActivity> activity=ActivityScenario.launch(MainActivity.class)){
   boolean loaded=false;for(int i=0;i<60;i++){String count=evaluate(activity,"Number((document.getElementById('catalog-status')?.textContent||'').split(' ')[0].replace(/[^0-9]/g,''))");try{if(Integer.parseInt(count)>1541){loaded=true;break;}}catch(NumberFormatException ignored){}Thread.sleep(250);}assertTrue("Expanded catalog must load from APK assets without internet",loaded);assertEquals("true",evaluate(activity,"document.getElementById('native-recorder').hidden===false"));assertEquals("true",evaluate(activity,"document.getElementById('browser-recorder').hidden===true && document.getElementById('native-recorder').contains(document.getElementById('hike-name'))"));
  }finally{shell("svc wifi enable");shell("svc data enable");}
 }
 @Test public void transCanadaSectionsAndFerriesWorkOffline()throws Exception {
  Context c=InstrumentationRegistry.getInstrumentation().getTargetContext();try(java.io.InputStream in=c.getAssets().open("data/trans-canada-trail.json")){org.json.JSONObject p=new org.json.JSONObject(new String(in.readAllBytes(),java.nio.charset.StandardCharsets.UTF_8));assertTrue(p.getJSONArray("routes").length()>100);}
  shell("svc wifi disable");shell("svc data disable");
  try(ActivityScenario<MainActivity> activity=ActivityScenario.launch(MainActivity.class)){
   boolean ready=false;for(int i=0;i<80;i++){if("true".equals(evaluate(activity,"Boolean(document.getElementById('browse-tct')&&!document.getElementById('browse-tct').disabled)"))){ready=true;break;}Thread.sleep(250);}assertTrue("Bundled TCT collection must load offline",ready);
   evaluate(activity,"(()=>{document.querySelector('[data-tab=explore]').click();document.getElementById('browse-tct').click();document.getElementById('catalog-search').value='Port aux Basques';document.getElementById('catalog-search').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#catalog-results button').click();return true;})()");
   boolean opened=false;for(int i=0;i<60;i++){if("true".equals(evaluate(activity,"Boolean(document.getElementById('detail').open&&document.getElementById('begin-route')?.disabled&&document.getElementById('plan-this')?.disabled)"))){opened=true;break;}Thread.sleep(250);}assertTrue("Ferry must open offline with hiking and walking-plan actions disabled",opened);
  }finally{shell("svc wifi enable");shell("svc data enable");}
 }
 @Test public void recordsToDiskWhileScreenIsOff()throws Exception {
  Context c=InstrumentationRegistry.getInstrumentation().getTargetContext();String appId=c.getPackageName();shell("pm grant "+appId+" android.permission.ACCESS_FINE_LOCATION");shell("pm grant "+appId+" android.permission.ACCESS_COARSE_LOCATION");shell("pm grant "+appId+" android.permission.POST_NOTIFICATIONS");shell("appops set "+appId+" android:mock_location allow");
  TrackDb db=new TrackDb(c);db.finish();LocationManager lm=(LocationManager)c.getSystemService(Context.LOCATION_SERVICE);
  try(ActivityScenario<MainActivity> activity=ActivityScenario.launch(MainActivity.class)){
   lm.addTestProvider(LocationManager.GPS_PROVIDER,false,false,false,false,true,true,true,Criteria.POWER_LOW,Criteria.ACCURACY_FINE);lm.setTestProviderEnabled(LocationManager.GPS_PROVIDER,true);
   boolean ready=false;for(int i=0;i<60;i++){if("true".equals(evaluate(activity,"Boolean(document.getElementById('native-start')?.onclick)"))){ready=true;break;}Thread.sleep(250);}assertTrue("Recorder UI must initialize",ready);
   assertEquals("true",evaluate(activity,"(()=>{document.querySelector('[data-tab=record]').click();document.getElementById('hike-name').value='Screen-off emulator validation';document.getElementById('native-start').click();return document.getElementById('browser-recorder').hidden;})()"));Thread.sleep(1500);assertNotNull(db.active());String originalId=db.active();activity.onActivity(a->a.new Bridge().start("Duplicate start must not end this hike"));Thread.sleep(300);assertEquals("A repeated start must preserve the active native track",originalId,db.active());shell("input keyevent KEYCODE_HOME");shell("input keyevent KEYCODE_SLEEP");
   for(int i=0;i<4;i++){Location p=new Location(LocationManager.GPS_PROVIDER);p.setLatitude(51.18+i*.0004);p.setLongitude(-115.57);p.setAccuracy(5);p.setAltitude(1400+i);p.setTime(System.currentTimeMillis());p.setElapsedRealtimeNanos(SystemClock.elapsedRealtimeNanos());lm.setTestProviderLocation(LocationManager.GPS_PROVIDER,p);Thread.sleep(6000);}
   org.json.JSONObject snapshot=new org.json.JSONObject(db.snapshot());org.json.JSONObject track=snapshot.getJSONArray("tracks").getJSONObject(0);assertTrue("Native track must remain active",track.getBoolean("active"));assertTrue("At least two screen-off fixes must reach SQLite",track.getJSONArray("points").length()>=2);
   c.stopService(new Intent(c,TrackingService.class));db.finish();db.close();db=new TrackDb(c);assertNull(db.active());assertTrue(new org.json.JSONObject(db.snapshot()).getJSONArray("tracks").getJSONObject(0).getJSONArray("points").length()>=2);
  }finally{shell("input keyevent KEYCODE_WAKEUP");try{lm.removeTestProvider(LocationManager.GPS_PROVIDER);}catch(Exception ignored){}c.stopService(new Intent(c,TrackingService.class));db.close();}
 }
}
