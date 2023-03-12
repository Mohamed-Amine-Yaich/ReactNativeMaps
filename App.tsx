/* import React, { useState, useRef, useMemo } from "react";
import MapView, { AnimatedRegion, LatLng, Marker, MarkerAnimated, Region } from "react-native-maps";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  LayoutChangeEvent,
  Image,
  Platform,
} from "react-native";
import type { PointFeature } from "supercluster";
import type { BBox, GeoJsonProperties } from "geojson";
import useSupercluster from "use-supercluster";
import { FontAwesome5 } from "@expo/vector-icons";
import SearchCard from "./src/components/SearchCard";
import MyLocation from "./src/components/MyLocation";
import MapType from "./src/components/MapType";
import NewMarker from "./src/components/NewMarker";
import MapTypeCard from "./src/components/MapTypeCard";

import * as Location from "expo-location";
import database from "./database";

interface PointProperties {
  cluster: boolean;
  category: string;
  id: number;
  color: string;
}

const getMyLocation = async (): Promise<Region | undefined> => {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return;

  const { latitude, longitude } = (await Location.getCurrentPositionAsync({}))
    .coords;
  const region = {
    latitude,
    longitude,
    latitudeDelta: 0.135,
    longitudeDelta: 0.135,
  };
  return region;
};

const regionToBoundingBox = (region: Region): BBox => {
  let lngD: number;
  if (region.longitudeDelta < 0) lngD = region.longitudeDelta + 360;
  else lngD = region.longitudeDelta;

  return [
    region.longitude - lngD, // westLng - min lng
    region.latitude - region.latitudeDelta, // southLat - min lat
    region.longitude + lngD, // eastLng - max lng
    region.latitude + region.latitudeDelta, // northLat - max lat
  ];
};

export default function App() {
  const [showCard, setShowCard] = useState<"search" | "mapType">("search");
  const [cardHeight, setCardHeight] = useState(0);
  const [mapType, setMapType] = useState<"standard" | "satellite" | "terrain">(
    "standard"
  );
  const mapRef = useRef<MapView>(null);

  const [showMarkerSetter, setShowMarkerSetter] = useState(false);
  const [markerCoordinates, setMarkerCoordinates] = useState<LatLng>({
    latitude: 0,
    longitude: 0,
  });

  const [bounds, setBounds] = useState<BBox>();
  const [zoom, setZoom] = useState(12);

  const onRegionChangeComplete = async (region: Region, _?: object) => {
    const mapBounds = regionToBoundingBox(region);
    setBounds(mapBounds);
    const camera = await mapRef.current?.getCamera();
    setZoom(camera?.zoom ?? 10);
  };

  const goToMyLocation = async () => {
    const region = await getMyLocation();
    region && mapRef.current?.animateToRegion(region, 2000);
  };

  const handleLayoutChange = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setCardHeight(height);
  };

  const handleNewMarker = async () => {
    if (!showMarkerSetter) {
      const camera = await mapRef.current?.getCamera();
      camera?.center && setMarkerCoordinates(camera?.center);
    } else {
      database?.markers.push({
        id: database?.markers.length + 1,
        color: "green",
        coordinates: markerCoordinates,
      });
    }
    setShowMarkerSetter((v) => !v);
  };

  const handleClusterPress = (cluster_id: number): void => {
    // Zoom to cluster
    const leaves = supercluster?.getLeaves(cluster_id);
    if (!leaves) return;
    const coords = leaves?.map((l) => ({
      longitude: l.geometry.coordinates[0],
      latitude: l.geometry.coordinates[1],
    }));
    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: {
        top: 200,
        right: 50,
        bottom: 250,
        left: 50,
      },
      animated: true,
    });
  };

  const points = useMemo<
    PointFeature<GeoJsonProperties & PointProperties>[]
  >(() => {
    return database?.markers.map((m) => ({
      type: "Feature",
      properties: {
        cluster: false,
        category: "markers",
        id: m.id,
        color: m.color,
      },
      geometry: {
        type: "Point",
        coordinates: [m.coordinates.longitude, m.coordinates.latitude],
      },
    }));
  }, [database?.markers.length]);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom,
    options: { radius: 200, maxZoom: 20 },
  });

  return (
    <View style={styles.container}>
      <MapView
        provider={"google"}
        style={styles.map}
        ref={mapRef}
        onMapReady={() => {
          goToMyLocation();
        }}
        onRegionChangeComplete={onRegionChangeComplete}
        showsMyLocationButton={false}
        mapType={mapType}
        showsUserLocation
        zoomControlEnabled={true}
      >
        {showMarkerSetter && (
          <Marker
            draggable
            coordinate={markerCoordinates}
            onDragEnd={(e) => setMarkerCoordinates(e.nativeEvent.coordinate)}
          />
        )}
        {clusters?.map((point) => {
          const [longitude, latitude] = point.geometry.coordinates;
          const coordinates = { latitude, longitude };
          const properties = point.properties;

          if (properties?.cluster) {
            const size =
              Math.round(25 + (properties.point_count * 75) / points.length) *
              2;
            console.log('point count',properties.point_count);
            console.log('cluster length :',clusters.length)
            if (Platform.OS === 'android') {
              if (currentmarker) {
                  this.marker.animateMarkerToCoordinate(coordinates,4000);//  number of duration between points
              }
          } 
 
            return (
              <Marker
                key={`cluster-${properties.cluster_id}`}
                coordinate={coordinates}
                onPress={() => handleClusterPress(properties.cluster_id)}
              >
                <View /* style={[styles.cluster, { width: size, height: size }]} 
                >
                                   <FontAwesome5 name="map-marker" size={Math.ceil(size*1.5)} color='#8DB255' /> 


                  <Image
                    source={require("./src/assets/pin.png")}
                    style={{ width: 50, height: 50 }}
                  />
                  <Text
                    style={[
                      styles.clusterCount,
                      {
                        position: "absolute" /*, left:10,top:5 ,
                        borderRadius: 100,
                        borderWidth: 1,
                        width: 15,
                        height: 15,
                        alignSelf: "center",
                        justifyContent: "center",
                        marginTop: 5,
                        textAlign: "center",
                        top: 9,
                        backgroundColor: "black",
                        fontSize: 8,
                      },
                    ]}
                  >
                    {properties.point_count}
                  </Text>
                </View>
              </Marker>
            );
          }

          return (
            <customMarker
              key={properties.id}
              coordinate={coordinates}
              clus
            />
          );
        })}
      </MapView>

    {showCard === "search" ? (
        <SearchCard handleLayoutChange={handleLayoutChange} />
      ) : (
        <MapTypeCard
          handleLayoutChange={handleLayoutChange}
          closeModal={() => setShowCard("search")}
          changeMapType={(mapType) => setMapType(mapType)}
        />
      )} 

      <MyLocation mBottom={cardHeight} onPress={goToMyLocation} />
      <MapType
        mBottom={cardHeight + 50}
        onPress={() => setShowCard("mapType")}
      />
      <NewMarker
        mBottom={cardHeight + 100}
        showMarkerSetter={showMarkerSetter}
        onPress={handleNewMarker}
      />
    </View>
  );
}

const customMarker = (props)=>{



return (
<Marker
key={props.id}
coordinate={}

/>)

}














const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  cluster: {
    borderRadius: 100,
    backgroundColor: "#334155",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  clusterCount: {
    color: "#FFF",
    fontWeight: "bold",
  },
});
 */
import React, { Component } from "react";
import { Platform, View } from "react-native";
import { AnimatedRegion, Marker } from "react-native-maps";
import MapView from "react-native-map-clustering";
export default  App = ()=>{
  const mapRef = React.useRef<MapView>()
 
  const markerRef = React.useRef<Marker>(null)
  const superClusterRef = React.useRef<any>(null)


  const animatedMarkers = [
    {
      coordinate: new AnimatedRegion( { latitude: 37.78825, longitude: -122.4324 ,  latitudeDelta: 0.012,
        longitudeDelta:0.012,}),
      title: "Marker 1",
    },
    {
      coordinate: new AnimatedRegion({ latitude: 37.78925, longitude: -122.4344,  latitudeDelta: 0.012,
        longitudeDelta:0.012, }),
      title: "Marker 2",
    },
    {
      coordinate: new AnimatedRegion({ latitude: 37.78925, longitude: -122.4324 ,  latitudeDelta: 0.012,
        longitudeDelta:0.012,}),
      title: "Marker 3",
    },
    {
      coordinate: new AnimatedRegion({ latitude: 37.79125, longitude: -122.4354,  latitudeDelta: 0.012,
        longitudeDelta:0.012, }),
      title: "Marker 4",
    },
    {
      coordinate: new AnimatedRegion({ latitude: 37.79125, longitude: -122.4364 ,  latitudeDelta: 0.012,
        longitudeDelta:0.012,}),
      title: "Marker 5",
    },
    {
      coordinate: new AnimatedRegion({ latitude: 37.79225, longitude: -122.4324,  latitudeDelta: 0.012,
        longitudeDelta:0.012, }),
      title: "Marker 6",
    },
    {
      coordinate: new AnimatedRegion({ latitude: 37.79525, longitude: -122.4374 ,  latitudeDelta: 0.012,
        longitudeDelta:0.012,}),
      title: "Marker 7",
    },
    {
      coordinate: new AnimatedRegion({ latitude: 37.79825, longitude: -122.4324 ,  latitudeDelta: 0.012,
        longitudeDelta:0.012,}),
      title: "Marker 8",
    },
    {
      coordinate: new AnimatedRegion({ latitude: 37.80125, longitude: -122.4334,  latitudeDelta: 0.012,
        longitudeDelta:0.012, }),
      title: "Marker 9",
    },
    {
      coordinate: new AnimatedRegion({ latitude: 37.80225, longitude: -122.4364 ,  latitudeDelta: 0.012,
        longitudeDelta:0.012,}),
      title: "Marker 10",
    },
  ]


      const markers= [
        {
          coordinate: { latitude: 37.78825, longitude: -122.4324 , },
          title: "Marker 1",
        },
        {
          coordinate:{ latitude: 37.78925, longitude: -122.4344 },
          title: "Marker 2",
        },
        {
          coordinate:{ latitude: 37.78925, longitude: -122.4324 },
          title: "Marker 3",
        },
        {
          coordinate:{ latitude: 37.79125, longitude: -122.4354 },
          title: "Marker 4",
        },
        {
          coordinate:{ latitude: 37.79125, longitude: -122.4364 },
          title: "Marker 5",
        },
        {
          coordinate:{ latitude: 37.79225, longitude: -122.4324 },
          title: "Marker 6",
        },
        {
          coordinate:{ latitude: 37.79525, longitude: -122.4374 },
          title: "Marker 7",
        },
        {
          coordinate:{ latitude: 37.79825, longitude: -122.4324 },
          title: "Marker 8",
        },
        {
          coordinate:{ latitude: 37.80125, longitude: -122.4334 },
          title: "Marker 9",
        },
        {
          coordinate:{ latitude: 37.80225, longitude: -122.4364 },
          title: "Marker 10",
        },
      ]

   


    return (
      <View style={{ flex: 1 }}>
        <MapView
   /*      ref={mapRef} */
        renderCluster={(cluster :  {clusterColor: string,
        clusterFontFamily: string|undefined,
        clusterTextColor :string,
        geometry:  {
          coordinates: [
           longitude:number,
            latitude:number,
          ],
          type: string,
        },
        id: number,
        onPress: ()=>{},
        properties: {
          cluster: boolean,
          cluster_id: number,
          point_count: number,
          point_count_abbreviated: number,
        },
        type: string,
      }) => {
/*             console.log(cluster);
 */          return (
              <Marker
                title={cluster.properties.point_count.toString()}
                style={{ width:25,height:25,borderColor:'blue'}}
                coordinate={{ latitude: cluster.geometry?.coordinates[1]? cluster.geometry?.coordinates[1]:  37.79525 , longitude: cluster.geometry?.coordinates[0]?cluster.geometry?.coordinates[0] : -122.4374  }}
                key={cluster.properties.cluster_id}
                          />
            ); 
          }} 
          onMarkersChange={(markers)=>{
            console.log('markerchange',markers?.length)

          }}
          
      tracksViewChanges={true} 
          style={{ flex: 1 }}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          animationEnabled={true}
          spiralEnabled={false}
          clusteringEnabled
          zoomControlEnabled={true}
/*           superClusterRef={superClusterRef}
 */         /*  clusterColor={"yellow"} */
         preserveClusterPressBehavior
         onClusterPress={(clusters,markers)=>{
          console.log('cluster press',)
          console.log(clusters)
          console.log(markers)



         }}
        >
        { markers.map((marker) =>{ 
          console.log('marker',marker)
          return(
           <CustomMarker  title={marker.title} coordinate={marker.coordinate} key={marker.title} /> 
/*            <Marker
ref={markerRef}
 key={marker.title}
coordinate={marker.coordinate}
title={marker.title}
/> */
         )})}
        </MapView>
      </View>
    );
  }


const CustomMarker =(props)=>{

const markerRef = React.useRef<Marker>(null)

/* const newCoordinate = {
  latitude: props.coordinate.latitude,
  longitude:  props.coordinate.latitude,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
}; */

if (Platform.OS === 'android') {
  if (markerRef.current) {
    markerRef.current?.animateMarkerToCoordinate(props.coordinate, 100000);
  }
} 



return <Marker
ref={markerRef}
 
coordinate={props.coordinate}
title={props.title}
/>


} 