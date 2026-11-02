package ca.trailbound.app;
import android.app.*;
import android.content.*;
import android.content.pm.ServiceInfo;
import android.location.*;
import android.os.*;
public final class TrackingService extends Service implements LocationListener {
 private TrackDb db;private LocationManager locations;private String id;private boolean first=true;private String status="Waiting for GPS";
 public void onCreate(){super.onCreate();db=new TrackDb(this);locations=(LocationManager)getSystemService(LOCATION_SERVICE);((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(new NotificationChannel("tracking","Hike recording",NotificationManager.IMPORTANCE_LOW));}
 private Notification notification(){PendingIntent open=PendingIntent.getActivity(this,0,new Intent(this,MainActivity.class),PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);return new Notification.Builder(this,"tracking").setContentTitle("Trailbound is recording your hike").setContentText(status+" · tap to finish").setSmallIcon(android.R.drawable.ic_menu_mylocation).setContentIntent(open).setOngoing(true).setCategory(Notification.CATEGORY_SERVICE).build();}
 public int onStartCommand(Intent intent,int flags,int startId){
  if(intent!=null&&"STOP".equals(intent.getAction())){db.finish();stopSelf();return START_NOT_STICKY;}
  id=db.active();if(id==null){stopSelf();return START_NOT_STICKY;}
  try{if(checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION)!=android.content.pm.PackageManager.PERMISSION_GRANTED)throw new SecurityException("Precise location permission is required");if(Build.VERSION.SDK_INT>=29)startForeground(41,notification(),ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);else startForeground(41,notification());locations.removeUpdates(this);if(!locations.isProviderEnabled(LocationManager.GPS_PROVIDER))status="GPS disabled; enable location to resume";locations.requestLocationUpdates(LocationManager.GPS_PROVIDER,5000,3,this);return START_STICKY;}catch(SecurityException|IllegalArgumentException e){status="Location unavailable: "+e.getMessage();db.finish();stopSelf();return START_NOT_STICKY;}
 }
 public void onLocationChanged(Location p){if(id==null||!p.hasAccuracy()||!TrackPolicy.acceptable(p.getLatitude(),p.getLongitude(),p.getAccuracy(),p.getTime(),System.currentTimeMillis()))return;
  long last=db.lastTime(id);if(p.getTime()<=last)return;try{db.append(id,p,first&&last>0||TrackPolicy.gap(last,p.getTime()));first=false;status="GPS saved at "+new java.text.SimpleDateFormat("HH:mm:ss",java.util.Locale.getDefault()).format(new java.util.Date(p.getTime()));((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).notify(41,notification());}catch(android.database.SQLException e){status="Storage error; open app and export track";((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).notify(41,notification());locations.removeUpdates(this);}
 }
 public void onProviderDisabled(String provider){status="GPS disabled; no points are being saved";((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).notify(41,notification());}
 public void onProviderEnabled(String provider){}
 public void onStatusChanged(String provider,int status,Bundle extras){}
 public IBinder onBind(Intent intent){return null;}
 public void onDestroy(){if(locations!=null)locations.removeUpdates(this);db.close();super.onDestroy();}
}
