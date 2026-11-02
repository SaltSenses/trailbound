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
 @Test public void recordsToDiskWhileScreenIsOff()throws Exception {
  Context c=InstrumentationRegistry.getInstrumentation().getTargetContext();shell("pm grant ca.trailbound.app android.permission.ACCESS_FINE_LOCATION");shell("pm grant ca.trailbound.app android.permission.ACCESS_COARSE_LOCATION");shell("pm grant ca.trailbound.app android.permission.POST_NOTIFICATIONS");shell("appops set ca.trailbound.app android:mock_location allow");
  TrackDb db=new TrackDb(c);db.finish();LocationManager lm=(LocationManager)c.getSystemService(Context.LOCATION_SERVICE);
  try(ActivityScenario<MainActivity> activity=ActivityScenario.launch(MainActivity.class)){
   lm.addTestProvider(LocationManager.GPS_PROVIDER,false,false,false,false,true,true,true,Criteria.POWER_LOW,Criteria.ACCURACY_FINE);lm.setTestProviderEnabled(LocationManager.GPS_PROVIDER,true);
   activity.onActivity(a->a.new Bridge().start("Screen-off emulator validation"));Thread.sleep(1500);assertNotNull(db.active());shell("input keyevent KEYCODE_HOME");shell("input keyevent KEYCODE_SLEEP");
   for(int i=0;i<4;i++){Location p=new Location(LocationManager.GPS_PROVIDER);p.setLatitude(51.18+i*.0004);p.setLongitude(-115.57);p.setAccuracy(5);p.setAltitude(1400+i);p.setTime(System.currentTimeMillis());p.setElapsedRealtimeNanos(SystemClock.elapsedRealtimeNanos());lm.setTestProviderLocation(LocationManager.GPS_PROVIDER,p);Thread.sleep(6000);}
   org.json.JSONObject snapshot=new org.json.JSONObject(db.snapshot());org.json.JSONObject track=snapshot.getJSONArray("tracks").getJSONObject(0);assertTrue("Native track must remain active",track.getBoolean("active"));assertTrue("At least two screen-off fixes must reach SQLite",track.getJSONArray("points").length()>=2);
   c.stopService(new Intent(c,TrackingService.class));db.finish();db.close();db=new TrackDb(c);assertNull(db.active());assertTrue(new org.json.JSONObject(db.snapshot()).getJSONArray("tracks").getJSONObject(0).getJSONArray("points").length()>=2);
  }finally{shell("input keyevent KEYCODE_WAKEUP");try{lm.removeTestProvider(LocationManager.GPS_PROVIDER);}catch(Exception ignored){}c.stopService(new Intent(c,TrackingService.class));db.close();}
 }
}
