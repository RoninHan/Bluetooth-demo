import { Component } from 'react'
import { View, Button, Text } from '@tarojs/components'
import { observer, inject } from 'mobx-react'
import Taro from '@tarojs/taro'
import './index.scss'

interface IndexProps { }

interface IndexState {
  deviceData: Array<{ deviceId: string, name: string }>;
  deviceId: string;
}

@inject('store')
@observer
class Index extends Component<IndexProps, IndexState> {
  constructor(props: IndexProps) {
    super(props);
    this.state = {
      deviceData: [],
      deviceId: ""
    }
  }

  componentDidMount() {
    Taro.onBluetoothDeviceFound((res) => {
      res.devices.forEach((device) => {
        // 这里可以做一些过滤
        console.log('Device Found', device)
        if (device.name === "") {
          return;
        }
        let devs = this.state.deviceData;
        devs.push({
          deviceId: device.deviceId,
          name: device.name,
        });
        this.setState({
          deviceData: devs
        })
      })
      // 找到要搜索的设备后，及时停止扫描
      Taro.stopBluetoothDevicesDiscovery()
    });

    Taro.openBluetoothAdapter({
      mode: 'central'
    });

    Taro.onBLECharacteristicValueChange((res) => {
      console.log('onBLECharacteristicValueChange', res)
    })
  }

  componentWillUnmount() { }

  componentDidShow() { }

  componentDidHide() { }

  lineDevice = (deviceId: string) => {
    this.setState({
      deviceId: deviceId
    });
    // 这里添加你的设备连接逻辑
    this.bleGattLink(deviceId);
  }

  send = () => {
    if (!this.state.deviceId) {
      //判断是否存在，不存在就提示
      console.error('error:require deviceid');
      return;
    }

    let deviceId = this.state.deviceId;
    let hexString = '';

    let sendBuf = this.hexToBuffer(hexString);
    Taro.writeBLECharacteristicValue({
      // 这里的 deviceId 需要在 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
      deviceId,
      serviceId: "000000ff-0000-1000-8000-00805f9b34fb",
      characteristicId: "0000ff01-0000-1000-8000-00805f9b34fb",
      // 这里的value是ArrayBuffer类型
      value: sendBuf,
      success(res) {
        console.log('writeBLECharacteristicValue success', res.errMsg)
      }
    })
  }


  hexToBuffer = (hex: string): ArrayBuffer => {
    const pairs = hex.match(/[\s\S]{1,2}/g) || [];
    const decimalArray = pairs.map(pair => parseInt(pair, 16));
    const arr = new Uint8Array(decimalArray.length);
    for (let i = 0; i < decimalArray.length; i++) {
      arr[i] = decimalArray[i];
    }
    return arr.buffer;
  }

  ab2hex = (buffer: ArrayBuffer) => {
    let hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function (bit) {
        return ('00' + bit.toString(16)).slice(-2)
      }
    )
    return hexArr.join('');
  }

  bleGattLink = (deviceId: string) => {
    Taro.createBLEConnection({
      deviceId, // 搜索到设备的 deviceId
      success: () => {
        // 模拟设备链接成功
        console.log('createBLEConnection success');
        this.setState({
          deviceId: deviceId
        });
        // 连接成功，获取服务
        Taro.notifyBLECharacteristicValueChange({
          state: true,
          deviceId,
          serviceId: "000000ff-0000-1000-8000-00805f9b34fb",
          characteristicId: "0000ff01-0000-1000-8000-00805f9b34fb",
          success(res) {
            console.log('notifyBLECharacteristicValueChange success', res.errMsg)
          }
        });
      }
    })
  }

  render() {
    return (
      <View className='index'>
        <View>
          {
            this.state.deviceData.map((device) => {
              return (
                <View key={device.deviceId} onClick={() => {
                  this.setState({
                    deviceId: device.deviceId
                  })
                }}>
                  <Text>{device.name}</Text>
                  <Button onClick={() => this.lineDevice(device.deviceId)}>link</Button>
                </View>
              )
            })
          }
        </View>
        <Button onClick={this.send}>Send</Button>
      </View>
    )
  }
}

export default Index