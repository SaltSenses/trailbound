package ca.trailbound.app;
import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.*;
import android.webkit.*;
import androidx.webkit.WebViewAssetLoader;
import java.io.*;
public final class MainActivity extends Activity {
 private WebView web;private TrackDb db;private String pendingName;private static final String ORIGIN="https://appassets.androidplatform.net";
 public void onCreate(Bundle saved){super.onCreate(saved);db=new TrackDb(this);web=new WebView(this);setContentView(web);web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);web.getSettings().setAllowFileAccess(false);web.getSettings().setAllowContentAccess(false);web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);web.addJavascriptInterface(new Bridge(),"TrailboundNative");
  WebViewAssetLoader loader=new WebViewAssetLoader.Builder().addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
  web.setWebViewClient(new WebViewClient(){public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){return loader.shouldInterceptRequest(r.getUrl());}public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){Uri u=r.getUrl();if(ORIGIN.equals(u.getScheme()+"://"+u.getHost())&&u.getPath().startsWith("/assets/"))return false;if(r.isForMainFrame()&&("https".equals(u.getScheme())||"http".equals(u.getScheme())))startActivity(new Intent(Intent.ACTION_VIEW,u));return true;}});web.loadUrl(ORIGIN+"/assets/index.html");
 }
 private void startTrack(String name){if(checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)!=PackageManager.PERMISSION_GRANTED){pendingName=name;requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION},10);return;}if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED){pendingName=name;requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},11);return;}try{if(db.active()!=null)throw new IllegalStateException("Finish the active native track first");db.start(name);startForegroundService(new Intent(this,TrackingService.class));}catch(Exception e){db.finish();new AlertDialog.Builder(this).setMessage(e.getMessage()).setPositiveButton("OK",null).show();}}
 public void onRequestPermissionsResult(int code,String[] permissions,int[] results){super.onRequestPermissionsResult(code,permissions,results);if(code==10&&checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)==PackageManager.PERMISSION_GRANTED)startTrack(pendingName);else if(code==11){if(checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)==PackageManager.PERMISSION_GRANTED)startTrack(pendingName);else new AlertDialog.Builder(this).setMessage("Enable notifications for a visible recording indicator, then try again.").setPositiveButton("OK",null).show();}}
 public final class Bridge {
  @JavascriptInterface public String snapshot(){return db.snapshot();}
  @JavascriptInterface public void start(String name){runOnUiThread(()->startTrack(name==null?"Hike":name.substring(0,Math.min(200,name.length()))));}
  @JavascriptInterface public void resume(){runOnUiThread(()->{if(db.active()!=null)startForegroundService(new Intent(MainActivity.this,TrackingService.class));});}
  @JavascriptInterface public void stop(){runOnUiThread(()->{db.finish();stopService(new Intent(MainActivity.this,TrackingService.class));});}
  @JavascriptInterface public void exportTracks(){runOnUiThread(()->{Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT).setType("application/json").addCategory(Intent.CATEGORY_OPENABLE).putExtra(Intent.EXTRA_TITLE,"trailbound-native-backup.json");startActivityForResult(i,20);});}
 }
 protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==20&&result==RESULT_OK&&data!=null&&data.getData()!=null){try(OutputStream out=getContentResolver().openOutputStream(data.getData())){out.write(db.snapshot().getBytes(java.nio.charset.StandardCharsets.UTF_8));}catch(Exception e){new AlertDialog.Builder(this).setMessage("Export failed: "+e.getMessage()).setPositiveButton("OK",null).show();}}}
 public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
 protected void onDestroy(){web.removeJavascriptInterface("TrailboundNative");web.destroy();db.close();super.onDestroy();}
}
