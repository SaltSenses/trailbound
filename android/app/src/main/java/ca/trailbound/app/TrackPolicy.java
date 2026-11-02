package ca.trailbound.app;
public final class TrackPolicy {
 private TrackPolicy() {}
 public static boolean acceptable(double lat,double lon,float accuracy,long timestamp,long now) {
  return Double.isFinite(lat)&&Double.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180&&Float.isFinite(accuracy)&&accuracy>=0&&accuracy<=60&&timestamp>0&&timestamp<=now+5000&&now-timestamp<=30000;
 }
 public static boolean gap(long previous,long current) { return previous>0&&current-previous>120000; }
}
